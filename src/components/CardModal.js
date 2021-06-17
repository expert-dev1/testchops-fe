import React, {useEffect, useState} from "react";
import {Button, Col, Divider, Icon, Modal, ProgressBar, Row} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import {
    cardInProgress,
    dateFormatISO,
    errorToast,
    infoToast,
    isAdmin,
    parseSqlDateTime,
    successToast,
    warningToast
} from "../api/Util";
import ConfirmationDialog from "./ConfirmationDialog";
import DateTimePicker from "react-datetime-picker";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import ChatBox from "./ChatBox";
import {DONE} from "../api/Constants";
import CompleteRatingButton from "./CompleteRatingButton";
import ReviewButton from "./ReviewButton";
import ArchiveButton from "./ArchiveButton";
import PlayPauseButton from "./PlayPauseButton";

import { MdTimeline ,MdPerson,MdSchedule,MdAdd,MdRedo,MdComment,MdAspectRatio,MdHelp,MdShortText,MdKeyboardVoice } from 'react-icons/md';
import {BsPersonSquare,BsLink} from 'react-icons/bs'

const INITIAL_STATE = {
    card: {
        card_title: "Card Details"
    },
    videoLink: '',
};

function parseVideoLink(link) {
    const DBX_LINK = /http(s)?:\/\/(www.)?dropbox.com(.)+/i;

    if(DBX_LINK.test(link)) {
        return link.replace('dl=0', 'raw=1');
    }

    return null;
}

export default (props) => {
    const [state, setState] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    const loadCard = async () => {
        if (loading) {
            return;
        }

        setLoading(true);
        try {
            const {data} = await axiosClient.get('/api/card/' + props.cardId);
            const videoLink = parseVideoLink(data.done_video_link || '');
            if(videoLink) {
                setShowVideo(true);
            } else {
                setShowVideo(false);
            }
            setState({
                card: data,
                dueDate: data.due_date ? parseSqlDateTime(data.due_date) : null,
                videoLink,
            });
            setAssignQa(data.assigned_qa_id || "0");
        } catch (err) {
            errorToast(err?.data?.message || "Couldn't fetch card content");
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if(props.isOpen) {
            loadCard().then(() => {});
            const video = document.getElementById("preview-vid");
            if(video) {
                video.load();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isOpen, props.cardId]);

    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [assignQa, setAssignQa] = useState(`${state.card?.assigned_qa_id}` || "0");

    function onConfirmChangeQa() {
        infoToast("Changing assigned QA");
        axiosClient.post('/api/card/assign', { card_id: props.cardId, assign_to: Number(assignQa)})
            .then(({data}) => {
                if(data.success) {
                    successToast(data.message);
                } else {
                    errorToast(data.message);
                }
            });
    }

    function updateDueDate() {
        if(!state.dueDate) {
            warningToast("Please select a valid due date");
            return;
        }

        let newDueDate = dateFormatISO(state.dueDate);

        axiosClient.post('/api/card/updateDueDate', {card_id: props.cardId, due_date: newDueDate})
            .then(() => {
                successToast(`Card ${state.card.card_title} due date changed to ${newDueDate}`);
            }).catch(err => {
                errorToast('Something went wrong, please try again');
                console.error(err);
            })
    }

    function makeUserSelection(qas) {
        return [
            <ConfirmationDialog
                key="confirm-assign-qa"
                onNegative={() => setConfirmationOpen(false)}
                onPositive={onConfirmChangeQa}
                confirmationHeader="Confirmation"
                confirmationDialogId="confirm-assign-qa-dialog"
                confirmation={confirmationOpen}
                confirmationText="Are you sure you want to change assigned QA?"
            />,
            <Col s={12} m={4} key="col-h">
                <BsPersonSquare style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} size = '25px'/><strong className="blue-text">Assigned to: </strong>
            </Col>,
            <Col s={12} m={8} key="col-s">
                <select name="qa_assigned"
                    style={{display: "inline", marginLeft: "36px", width: "90%"}}
                    key="assign-qa"
                    value={assignQa}
                    onChange={e => { setAssignQa(e.target.value); setConfirmationOpen(true); }}>
                    <option value="0">
                        None
                    </option>
                    <option value={`${state.card.assigned_qa_id}`}>
                        {state.card.assigned_to}
                    </option>
                    {
                        (qas || []).filter(qa => qa.client_id !== state.card.assigned_qa_id).map(qa => {
                            return (
                                <option value={`${qa.client_id}`} key={`select-qa-${qa.client_id}`}>
                                    {qa.fullname}
                                </option>
                            );
                        })
                    }
                </select>
            </Col>,
        ];
    }

    function makeCardHeader() {
        let ratingStar = "";
        let completeIcon = "";
        if (state.card.card_status === DONE) {
            let rating = state.card.rating ?
                (<strong className="fa-layers-text">{state.card.rating}</strong>) :
                (<FontAwesomeIcon icon="question" color="black" size="xs"/>);
            ratingStar = (
                <span className="fa-layers fa-fw fa-pull-right">
                    <FontAwesomeIcon icon="star" color="#FFD700"/>
                    {rating}
                </span>
            )

            if (state.card.is_complete) {
                completeIcon = (
                    <FontAwesomeIcon icon="check" color="green" pull="right"/>
                );
            }
        }

        return (
            <div>{state.card.card_title} {ratingStar}{completeIcon}</div>
        );
    }

    function makeQaAndDueDateRow() {
        let style = {marginTop: "10px"};
        if(isAdmin(props.me)) {
            return React.Children.toArray([
                <Row style={style}>
                    {makeUserSelection(props.qas)}
                </Row>,
                <Row>
                    {
                        state.dueDate && cardInProgress(state.card) && [
                            <Col s={12} m={4} key="due-on">
                                <MdSchedule style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Due on:</strong>
                            </Col>,
                            <Col s={12} m={8} key="save-due-date">
                                <Button icon={<Icon left>save</Icon>} className="center-align btn-primary" large
                                    style={{margin: 0, padding: 0, marginLeft: "36px", marginRight: "10px", paddingLeft: "16px"}}
                                    onClick={updateDueDate}>
                                </Button>
                                <DateTimePicker value={state.dueDate} amPmAriaLabel="Select AM/PM" clearIcon={null}
                                    onChange={(d) => setState(prev => ({...prev, dueDate: d}))}/>
                            </Col>,
                        ]
                    }
                </Row>,
            ]);
        } else {
            return React.Children.toArray([
                <Row style={style}>
                    <Col s={12} m={4}>
                        <BsPersonSquare style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Assigned to :</strong>
                    </Col>
                    <Col s={12} m={8}>
                        <div style={{paddingLeft: '36px'}}>{state.card.assigned_to}</div>
                    </Col>
                </Row>,
                state.dueDate && cardInProgress(state.card) ?
                    <Row style={style}>
                        <Col s={12} m={4}>
                        <MdSchedule style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Due on:</strong>
                        </Col>
                        <Col s={12} m={8}>
                            <div style={{paddingLeft: '36px'}}>{state.card.due_date}</div>
                        </Col>
                    </Row> : null,
            ]);
        }
    }

    function onVideoPreviewLoadedMetadata(e) {
        let videoPreview = document.getElementById("preview-vid");
        let duration = videoPreview.duration || 0.0;
        if(duration <= 0.01 || isNaN(duration) || !isFinite(duration)) {
            setShowVideo(false);
        }
    }

    function embedGDLink() {
        const GD_LINK = /http(s)?:\/\/drive\.google\.com\/file\/d\/([^\\]+)\/.*/i;
        if(GD_LINK.test(state.card.done_video_link)) {
            let matches = state.card?.done_video_link?.match(GD_LINK);
            if(matches.length >= 3) {
                return (
                    <Row>
                        <Divider/>
                        <br/>
                        <h5>Preview</h5>
                        <Col s={12} m={10} push="m1">
                            <iframe width="100%" height="100%" style={{minHeight: "30vh"}} title="Preview"
                                src={`https://drive.google.com/file/d/${matches[2]}/preview`}/>
                        </Col>
                    </Row>
                );
            }
        }
        return null;
    }

return (
    <Modal
        actions={[
            <Button flat modal="close" node="button" waves="red"><Icon right>close</Icon>Close</Button>
        ]}
        header={makeCardHeader()}
        id="viewCardModal"
        open={props.isOpen}
        options={{
            dismissible: true,
            endingTop: '10%',
            opacity: 0.5,
            preventScrolling: true,
            startingTop: '4%',
            onCloseEnd: () => { props.onClose(); setState(INITIAL_STATE); }
        }}
        style={{
            wordWrap: "break-word",
        }}
    >
        { loading && <ProgressBar/> }
        <Row className="right-align">
            <ReviewButton card={state.card} me={props.me}/>
            <CompleteRatingButton card={state.card} me={props.me}/>
            <ArchiveButton card={state.card} me={props.me} />
            <PlayPauseButton card={state.card} me={props.me} refresh={loadCard} />
        </Row>
        <Row>
            <Col s={12} m={6}>
                    <MdPerson size = '25px' style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} /><strong className="blue-text">Client:</strong><span> {state.card.client_name}</span>
            </Col>
            <Col s={12} m={6}>
                <MdAdd size = '25px' style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} /><strong className="blue-text">Created:</strong><span> {state.card.creation_time}</span>
            </Col>
        </Row>
        {
            state.card.revision_nr || state.card.timeline ?
                <Row>
                    {
                        state.card.timeline ?
                            <Col s={12} m={6}>
                                <MdTimeline size = '20px' style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}}/><strong className="blue-text">Timeline:</strong><span> {state.card.timeline} hrs</span>
                            </Col> : ""
                    }
                    {
                        state.card.revision_nr ?
                            <Col s={12} m={6}>
                                <MdRedo size = '25px' style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} /><strong className="blue-text">Revisions:</strong><span> {state.card.revision_nr}</span>
                            </Col> : ""
                    }
                </Row>
                : ""
        }
        <Divider/>
        {
            makeQaAndDueDateRow()
        }
        {
            state.card.comment && !cardInProgress(state.card) &&
            <Row>
                <Col s={12} m={4}>
                <MdComment style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Feedback: </strong>
                </Col>
                <Col s={12} m={8}>
                    <div style={{paddingLeft: '36px'}}>{state.card.comment}</div>
                </Col>
            </Row>
        }
        <Divider/>
        <Row style={{marginTop: "10px"}}>
            <Col s={12} m={4}>
                <BsLink style = {{ float : 'left' ,marginTop : '-5px',marginRight:'5px' }} size = "30px" /><strong className="blue-text">Raw Video Link:</strong>
            </Col>
            <Col s={12} m={8}>
                <div style={{paddingLeft: '36px'}}><a target="_blank" rel="noopener noreferrer" href={state.card.dropbox_link}>{state.card.dropbox_link}</a></div>
            </Col>
        </Row>
        {
            state.card.done_video_link &&
            <Row>
                <Col s={12} m={4}>
                    <BsLink style = {{ float : 'left' ,marginTop : '-5px',marginRight:'5px' }} size = '30px' /><strong className="blue-text">Done Video Link:</strong>
                </Col>
                <Col s={12} m={8}>
                    <div style={{paddingLeft: '36px'}}><a target="_blank" rel="noopener noreferrer" href={state.card.done_video_link}>{state.card.done_video_link}</a></div>
                </Col>
            </Row>
        }
        {
            state.card.repurpose_done_link &&
            <Row>
                <Col s={12} m={4}>
                <BsLink style = {{ float : 'left' ,marginTop : '-5px',marginRight:'5px' }} size = '30px' /><strong className="blue-text">Repurposed Video Link:</strong>
                </Col>
                <Col s={12} m={8}>
                    <div style={{paddingLeft: '36px'}}><a target="_blank" rel="noopener noreferrer" href={state.card.repurpose_done_link}>{state.card.repurpose_done_link}</a></div>
                </Col>
            </Row>
        }
        <Row>
            <Col s={12} m={4}>
            <MdAspectRatio style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} size = '25px' /><strong className="blue-text">Aspect Ratio:</strong>
            </Col>
            <Col s={12} m={8}>
                <div style={{paddingLeft: '36px'}}>{state.card.youtube_aspect_ratio}</div>
            </Col>
        </Row>
        <Row>
            <Col s={12} m={4}>
            <MdHelp style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} size = '25px' /><strong className="blue-text">What type of content is this for:</strong>
            </Col>
            <Col s={12} m={8}>
                <div style={{paddingLeft: '36px'}}>{state.card.video_purpose}</div>
            </Col>
        </Row>
        {
            state.card.additional_info && state.card.additional_info !== '' &&
            <Row>
                <Col s={12} m={4}>
                <MdShortText style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} size = '25px' /><strong className="blue-text">Anything else about this video:</strong>
                </Col>
                <Col s={12} m={8}>
                    <div style={{paddingLeft: '36px'}}>{state.card.additional_info.split("\n")
                        .map((i,key) => <div key={key}>{i}</div>)}</div>
                </Col>
            </Row>
        }
        {
            state.card.special_instructions && state.card.special_instructions !== '' &&
            <Row>
                <Col s={12} m={4}>
                <MdShortText style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Special Instructions:</strong>
                </Col>
                <Col s={12} m={8}>
                    <div style={{paddingLeft: '36px'}}>{state.card.special_instructions}</div>
                </Col>
            </Row>
        }
        {
            state.card.voice_note &&
            <Row>
                <Col s={12}>
                <MdKeyboardVoice style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} size = '25px' /><strong className="blue-text">Voice notes:</strong>
                    <br/>
                    <audio src={state.card.voice_note} controls="controls" style={{paddingLeft: '36px'}}/>
                </Col>
            </Row>
        }
        {
            state.card.repurpose_aspect ? React.Children.toArray([
                <Row>
                    <Col s={12} m={4}>
                    <MdAspectRatio style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Repurpose Video Formats:</strong>
                    </Col>
                    <Col s={12} m={8}>
                        <div style={{paddingLeft: '36px'}}>{state.card.repurpose_aspect}</div>
                    </Col>
                </Row>,
                <Row>
                    <Col s={12} m={4}>
                    <MdShortText style = {{ float : 'left' ,marginTop : '-2px',marginRight:'5px' }} size = '25px' /><strong className="blue-text">Repurpose Video Headline:</strong>
                    </Col>
                    <Col s={12} m={8}>
                        <div style={{paddingLeft: '36px'}}>{state.card.repurpose_headline || "N/A"}</div>
                    </Col>
                </Row>,
                <Row>
                    <Col s={12} m={4}>
                    <MdShortText style = {{ float : 'left' ,marginTop : '-2px' ,marginRight:'5px'}} size = '25px' /><strong className="blue-text">Repurpose Video Additional Info:</strong>
                    </Col>
                    <Col s={12} m={8}>
                        <div style={{paddingLeft: '36px'}}>{state.card.repurpose_additional_info || "N/A"}</div>
                    </Col>
                </Row>,
            ]) : null
        }
        {
            props.isOpen && (showVideo ?
                <Row>
                    <Divider/>
                    <br/>
                    <h5>Preview</h5>
                    <Col s={12} m={10} push="m1">
                        <video id="preview-vid" preload="metadata" controls
                            style={{width: "100%", maxHeight: "65vh", border: "1px solid black", borderRadius: "5px"}}
                            onLoadedMetadata={onVideoPreviewLoadedMetadata}
                            onError={onVideoPreviewLoadedMetadata}>
                            <source src={state.videoLink}/>Video Preview
                        </video>
                    </Col>
                </Row>
                : embedGDLink()
            )
        }
        {
            props.isOpen &&
            <Row>
                <ChatBox cardId={props.cardId} me={props.me} poll={props.isOpen}/>
            </Row>
        }
    </Modal>
);
};
