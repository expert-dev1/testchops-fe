import React, {useState} from "react";
import {errorToast, isCustomer, successToast} from "../api/Util";
import {Button, Col, Icon, Modal, Row, TextInput} from "react-materialize";
import ConfirmationDialog from "./ConfirmationDialog";
import {axiosClient} from "../api/httpClient";
import {connect} from "react-redux";
import Ratings from "react-ratings-declarative";
import {DONE} from "../api/Constants";

const replaceString = require('react-string-replace');
const actions = require('../actions');

export default connect(null, actions)(({me, card, fetchCards}) => {
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [ratingsOpen, setRatingsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    if(!isCustomer(me) || card.card_status !== DONE) {
        return "";
    }

    function onConfirmComplete() {
        axiosClient.post(`/api/card/${card.card_id}/markComplete`,
            {card_id: card.card_id, status: 1})
            .then(({data}) => {
                successToast(data.success || "Card marked completed!");
                setRatingsOpen(true);
            }).catch(err => {
                errorToast("Something went wrong, please try again");
                console.error(err);
            });
    }

    function onRate() {
        axiosClient.post(`/api/card/${card.card_id}/rate`,
            {card_id: card.card_id, rating, comment})
            .then(({data}) => {
                successToast("Feedback submitted, thank you!");
            }).catch(err => {
                errorToast("Something went wrong, please try again");
                console.error(err);
            });
    }

    let ratingsModal = (
        <Modal
            actions={[
                <Button flat modal="close" node="button" waves="red" large>Later</Button>,
                <Button modal="close" onClick={onRate} disabled={!rating} node="button" waves="green" className="btn-primary" large>Rate</Button>
            ]}
            header="Feedback"
            id="setFeedbackModal"
            open={ratingsOpen}
            style={{height: '28rem'}}
            options={{
                dismissible: true,
                endingTop: '10%',
                opacity: 0.5,
                preventScrolling: true,
                onOpenStart: () => setRating(0),
                onCloseEnd: () => { setRatingsOpen(false); fetchCards(); }
            }}
        >
            <Row style={{marginTop: "20px"}}>
                <Col s={12} m={10} l={6} push="m1 l3" className="align-center">
                    <Ratings
                        rating={rating}
                        widgetRatedColors="#faa64b"
                        changeRating={setRating}
                    >
                        <Ratings.Widget/>
                        <Ratings.Widget/>
                        <Ratings.Widget/>
                        <Ratings.Widget/>
                        <Ratings.Widget/>
                    </Ratings>
                </Col>
                <TextInput s={12} label="Any feedback?" icon="short_text" value={comment}
                           id={"txt-feedback-" + card.card_id}
                           onChange={e => setComment(e.target.value)}/>
            </Row>
        </Modal>
    );

    if(card.is_complete) {
        return (
            <Button className="btn-primary" icon={<Icon left>star</Icon>} onClick={() => setRatingsOpen(true)}>
                {ratingsModal}
                Rate
            </Button>
        );
    }

    return React.Children.toArray([
        <Button className="btn-primary" icon={<Icon left>check</Icon>} onClick={() => setConfirmationOpen(true)}>
            Mark As Done
            <ConfirmationDialog
                onNegative={() => setConfirmationOpen(false)}
                onPositive={onConfirmComplete}
                confirmationHeader="Mark as done"
                confirmationDialogId={"confirm-complete-" + card.card_id}
                confirmation={confirmationOpen}
                confirmationText={replaceString("Mark PLCHLDR as done?", /(PLCHLDR)/,
                    (match, i) => (<strong key={match + i}>{card.card_title}</strong>))}
            />
        </Button>,
        ratingsModal
    ]);
});
