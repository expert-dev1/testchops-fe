import {Card, CardTitle, Col, Container, Row} from "react-materialize";
import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    CommentsLegend,
    CreationDateLegend,
    DueDateLegend,
    PersonLegend,
    SubscriptionLegend,
    TimelineLegend,
    TimerLegend
} from "./legends";
import {convertServerToLocalTime, isCustomer, isTerminal, parseSqlDateTime} from "../api/Util";
import {DONE, VIDEO_REQUEST} from "../api/Constants";
import Timer from "react-compound-timer";
import {connect} from "react-redux";


function getDueDateRow(card) {
    if (card.card_status === DONE || card.card_status === VIDEO_REQUEST || card.paused) {
        return "";
    }
    let now = new Date().getTime();
    let elapsedTime = now - parseSqlDateTime(convertServerToLocalTime(card.assigned_time)).getTime();
    let expired = (now - parseSqlDateTime(convertServerToLocalTime(card.due_date || card.duedate)).getTime()) > 0;

    return [
        <Row className="request-card-line" key="timer-row">
            <Col s={6}>
                <TimerLegend/>&nbsp;
                {
                    expired ?
                        <span className="red-text">Expired</span>:
                        <Timer initialTime={elapsedTime}>
                            <Timer.Days /> days&nbsp;
                            <Timer.Hours formatValue={val => `${`${val}`.padStart(2, "0")}:`}/>
                            <Timer.Minutes formatValue={val => `${val}`.padStart(2, "0")}/>
                        </Timer>
                }
            </Col>
            {   card.timeline &&
                <Col s={6}>
                    <TimelineLegend/>&nbsp;{card.timeline} Hrs
                </Col>
            }
        </Row>,
        (card.due_date || card.duedate) &&
        <Row className="request-card-line" key="due-date-row">
            <Col m={12}>
                <DueDateLegend/>&nbsp;{card.due_date || card.duedate}
            </Col>
        </Row>,
    ];
}

export default connect(mapStateToProps)(({card, viewCard, auth}) => {
    let ratingStar = "";
    let completeIcon = "";
    let pausedIcon = "";
    let revisionIcon = "";
    const customer = isCustomer(auth.loggedInUser);
    if (card.card_status === DONE) {
        let rating = card.rating ?
            (<strong className="fa-layers-text">{card.rating}</strong>) :
            (<FontAwesomeIcon icon="question" color="black" size="xs"/>);
        ratingStar = (
            <span className="fa-layers fa-fw fa-pull-right">
                <FontAwesomeIcon icon="star" color="#FFD700"/>
                {rating}
            </span>
        )

        if (card.is_complete) {
            completeIcon = (
                <FontAwesomeIcon icon="check" color="green" pull="right"/>
            );
        }
    }

    if(card.revision_nr > 0 && !isTerminal(card.card_status)) {
        revisionIcon = (<FontAwesomeIcon icon="redo" color="red" pull="right"/>)
    }

    if(card.paused && !isTerminal(card.card_status)) {
        pausedIcon = (<FontAwesomeIcon icon="pause-circle" color="blue" pull="right"/>)
    }

    return (
        <Card className="request-card" onClick={() => viewCard(card.card_id)}
              header={<CardTitle className="request-card-title" image="" onClick={() => viewCard(card.card_id)}>
                  <p style={{display: "inherit"}}>{card.card_title}</p>{ratingStar}{completeIcon}{revisionIcon}{pausedIcon}
              </CardTitle>}
        >
            <Container>
                <Row className="request-card-line">
                    <Col s={6} m={12} l={6}>
                        <PersonLegend/>&nbsp;<strong>{card.firstname || card.lastname ? `${card.firstname || ''} ${card.lastname || ''}` : 'N/A'}</strong>
                    </Col>
                    <Col s={6} m={12} l={6}>
                        <CreationDateLegend/>&nbsp;{card.creation_time}
                    </Col>
                </Row>
                {
                    !customer ?
                        <Row className="request-card-line">
                            <Col s={6} m={12} l={6}>
                                <SubscriptionLegend/>&nbsp;<strong>{card.subscription_type}</strong>
                            </Col>
                        </Row> : null
                }
                {getDueDateRow(card)}
                {
                    card.comments ?
                        <Row>
                            <Col m={3}>
                                <CommentsLegend/>&nbsp;{card.comments}
                            </Col>
                        </Row> : ""
                }
            </Container>
        </Card>
    );
});

function mapStateToProps({auth}) {
    return {auth};
}
