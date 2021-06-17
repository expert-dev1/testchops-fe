import React, {useEffect, useState} from "react";
import Dragula from 'react-dragula';
import {
    caMoveRepurposeCard,
    canAcceptCard,
    canAcceptRepurposeCard,
    canMoveCard,
    isAdmin,
    isCustomer,
    validURL
} from "../api/Util";
import {CANCELED, DONE, EDITING, ON_HOLD, QA, VIDEO_REQUEST} from "../api/Constants";
import {
    addCardTimeline,
    addRevision,
    decideTimeline,
    markAsDone,
    moveCard,
    moveCardSubStatus,
    updateSorting
} from "../api/CardActions";
import ConfirmationDialog from "./ConfirmationDialog";
import {Button, Modal, TextInput} from "react-materialize";

let drake = null;

// https://bcmdr.netlify.app/2020/01/02/adding-drag-and-drop-to-a-react-application/
export default ({loggedInUser, refresh, setKey}) => {

    const [reviewCard, setReviewCard] = useState({ open: false });
    const [addTimeline, setAddTimeline] = useState({ open: false });
    const [confirmation, setConfirmation] = useState({ open: false });
    const [confirmationRepurpose, setConfirmationRepurpose] = useState({ open: false });
    const [doneLink, setDoneLink] = useState({ open: false });
    const [doneLinkUrl, setDoneLinkUrl] = useState("");
    const [repurposeDoneLink, setRepurposeDoneLink] = useState({ open: false });

    useEffect(() => {
        const admin = isAdmin(loggedInUser);
        const customer = isCustomer(loggedInUser);
        drake = Dragula({
            isContainer: (el) => {
                return el.classList.contains('drag-container');
            },
            moves: (el) => {
                if(el.attributes['data-card-repurpose-status']?.value) {
                    return caMoveRepurposeCard(loggedInUser, el.attributes['data-card-repurpose-status']?.value);
                } else {
                    return canMoveCard(loggedInUser, el.attributes['data-card-status']?.value,
                        Number(el.attributes['data-paused'].value), Number(el.attributes['data-complete'].value));
                }
            },
            accepts: (el, target) => {
                return canAcceptCard(loggedInUser, el.attributes['data-card-status']?.value, target.attributes['data-card-status']?.value)
                    || canAcceptRepurposeCard(loggedInUser, el.attributes['data-card-repurpose-status']?.value ||
                        (!isCustomer(loggedInUser) ? el.attributes['data-card-status']?.value : null),
                        target.attributes['data-card-repurpose-status']?.value);
            }
        });

        drake.on('drag', (el) => {
            // add 'is-moving' class to element being dragged
            el.classList.add('is-moving');
        });
        drake.on('dragend', (el) => {
            // remove 'is-moving' class from element after dragging has stopped
            el.classList.remove('is-moving');

            // add the 'is-moved' class for 600ms then remove it
            setTimeout(() => {
                el.classList.add('is-moved');
                setTimeout(() => el.classList.remove('is-moved'), 600);
            }, 100);
        });

        drake.on('drop', (el, target, source) => {
            let cardId = el.attributes['data-card-id'].value;
            let is_complete = el.attributes['data-complete'].value;
            let revisions = el.attributes['data-revisions'].value;
            let targetStatus = target.attributes['data-card-status']?.value;
            let sourceStatus = source.attributes['data-card-status']?.value;

            let targetSubStatus = target.attributes['data-card-repurpose-status']?.value;
            let sourceSubStatus = source.attributes['data-card-repurpose-status']?.value;

            if(targetSubStatus || sourceSubStatus) {
                let state = {open: true, cardId, newStatus: targetSubStatus, cardStatus: sourceSubStatus || sourceStatus};
                if(targetSubStatus === DONE) {
                    setRepurposeDoneLink(state)
                } else {
                    setConfirmationRepurpose(state);
                }
                return;
            }

            if (admin || customer) {
                if (sourceStatus === targetStatus && targetStatus === VIDEO_REQUEST) {
                    let videoRequests = [];
                    let sort = 1;
                    for (let i = 0; i < target.children.length; i++) {
                        let child = target.children[i];
                        let childCardId = child.attributes['data-card-id'].value;
                        if (childCardId) {
                            videoRequests.push(
                                {"card_id": Number(childCardId), "sort": sort});
                            sort++;
                            if (childCardId === cardId && i === Number(child.attributes['data-index'].value)) {
                                return;
                            }
                        }
                    }

                    updateSorting(videoRequests).then(() => refresh());
                } else if (customer && targetStatus === CANCELED) {
                    setConfirmation({open: true, cardId, newStatus: targetStatus, cardStatus: sourceStatus});
                }
            }

            if (!customer) {
                switch (targetStatus) {
                    case VIDEO_REQUEST:
                        if (sourceStatus !== targetStatus && (is_complete !== '1' || admin)) {
                            setReviewCard({open: true, cardId, cardStatus: sourceStatus});
                        }
                        break;
                    case EDITING:
                        if (is_complete !== '1' || admin) {
                            setAddTimeline({
                                open: true,
                                cardId,
                                cardStatus: sourceStatus,
                                timeline: decideTimeline(revisions)
                            });
                        }
                        break;
                    case ON_HOLD:
                    case QA:
                    case CANCELED:
                        if (sourceStatus !== targetStatus && (is_complete !== '1' || admin)) {
                            setConfirmation({
                                open: true,
                                cardId,
                                newStatus: targetStatus,
                                cardStatus: sourceStatus
                            });
                        }
                        break;
                    case DONE:
                        if (is_complete !== '1' || admin) {
                            setDoneLink({open: true, cardId, newStatus: DONE, cardStatus: sourceStatus});
                        }
                        break;
                    default:
                        break;
                }
            }
        });

        return () => {
            if(drake) {
                drake.destroy();
                drake = null;
            }
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedInUser]);

    return (
        <div>
            <ConfirmationDialog
                onNegative={() => {setReviewCard({ open: false }); setKey(k => k+1);}}
                onPositive={() => addRevision(reviewCard.cardId, reviewCard.cardStatus, refresh)}
                confirmationHeader="Revision"
                confirmationDialogId="confirm-revision"
                confirmation={reviewCard.open}
                confirmationText={"Are you sure you want to request revision?"}
            />
            <ConfirmationDialog
                onNegative={() => {setAddTimeline({ open: false }); setKey(k => k+1);}}
                onPositive={() => addCardTimeline(addTimeline.cardId, addTimeline.cardStatus, addTimeline.timeline, refresh)}
                confirmationHeader="Confirm"
                confirmationDialogId={"confirm-timeline"}
                confirmation={addTimeline.open}
                confirmationText={"Confirm move card to editing?"}
            />
            <ConfirmationDialog
                onNegative={() => {setConfirmation({open: false}); setKey(k => k+1);}}
                onPositive={() => moveCard(confirmation.cardId, confirmation.newStatus, confirmation.cardStatus, refresh)}
                confirmationHeader="Confirm"
                confirmationDialogId={"confirm-move"}
                confirmation={confirmation.open}
                confirmationText={"Are you sure you want to move the card?"}
            />
            <ConfirmationDialog
                onNegative={() => {setConfirmationRepurpose({open: false}); setKey(k => k+1);}}
                onPositive={() => moveCardSubStatus(confirmationRepurpose.cardId, confirmationRepurpose.newStatus,
                    confirmationRepurpose.cardStatus, refresh)}
                confirmationHeader="Confirm"
                confirmationDialogId={"confirm-move-sub"}
                confirmation={confirmationRepurpose.open}
                confirmationText={"Are you sure you want to move the card to repurposing?"}
            />
            <Modal
                actions={[
                    <Button flat modal="close" node="button" waves="red" large>Close</Button>,
                    <Button modal="close" onClick={() => markAsDone(doneLink.cardId, doneLink.cardStatus, doneLinkUrl, refresh)}
                            disabled={!validURL(doneLinkUrl)} node="button" waves="green" large>Submit</Button>
                ]}
                header="Set video link"
                id="setVideoLinkModal"
                open={doneLink.open}
                style={{height: '20rem'}}
                options={{
                    dismissible: true,
                    endingTop: '10%',
                    opacity: 0.5,
                    preventScrolling: true,
                    onOpenStart: () => setDoneLinkUrl(""),
                    onCloseEnd: () => {setDoneLink({open: false}); setKey(k => k+1);}
                }}
            >
                <TextInput s={12} label="Video Link" icon="link" validate id={"txt-done-link"}
                           value={doneLinkUrl} onChange={e => setDoneLinkUrl(e.target.value)}/>
            </Modal>
            <Modal
                actions={[
                    <Button flat modal="close" node="button" waves="red" large>Close</Button>,
                    <Button modal="close" onClick={() => moveCardSubStatus(repurposeDoneLink.cardId,
                        repurposeDoneLink.newStatus, repurposeDoneLink.cardStatus, refresh, { done_link: doneLinkUrl })}
                            disabled={!validURL(doneLinkUrl)} node="button" waves="green" large>Submit</Button>
                ]}
                header="Set repurposed video link"
                id="setReVideoLinkModal"
                open={repurposeDoneLink.open}
                style={{height: '20rem'}}
                options={{
                    dismissible: true,
                    endingTop: '10%',
                    opacity: 0.5,
                    preventScrolling: true,
                    onOpenStart: () => setDoneLinkUrl(""),
                    onCloseEnd: () => {setRepurposeDoneLink({open: false}); setKey(k => k+1);}
                }}
            >
                <TextInput s={12} label="Video Link" icon="link" validate id={"txt-rp-done-link"}
                           value={doneLinkUrl} onChange={e => setDoneLinkUrl(e.target.value)}/>
            </Modal>
        </div>
    );
}
