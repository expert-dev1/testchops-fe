import React, {useEffect, useState} from "react";
import {Button, Col, Container, Divider, Icon, Pagination, Row, Textarea} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import {
    breakNewLines,
    convertLocalToServerTime,
    convertServerToLocalTime,
    errorToast,
    parseSqlDateTime,
    warningToast
} from "../api/Util";
import * as _ from 'lodash';
import useInterval from "../hooks/UseInterval";
import Profile from './img/profile.png';

import {MdComment} from 'react-icons/md';

const reactStringReplace = require('react-string-replace');

const INITIAL_STATE = {
    me: {},
    cardId: null,
    lastUpdated: 0,
    comments: []
}

const REGEX_ADMIN = /(@[aA][dD][mM][iI][nN])/g;
const REGEX_CLIENT = /(@[cC][lL][iI][eE][nN][tT])/g;
const REGEX_EDITOR = /(@[eE][dD][iI][tT][oO][rR])/g;

function makeLinks(text) {
    return reactStringReplace(text, /(https?:\/\/[^ ]*)/g, (match, i) => (
        <strong><a key={match + i} className="comment-link" href={match}>{match}</a></strong>
    ));
}

function highlightTags(text) {
    let replacedText = reactStringReplace(text, REGEX_ADMIN, (match, i) => (
        <span key={match + i} className="comment-tag"><strong>{match}</strong></span>
    ));
    replacedText = reactStringReplace(replacedText, REGEX_CLIENT, (match, i) => (
        <span key={match + i} className="comment-tag"><strong>{match}</strong></span>
    ));
    replacedText = reactStringReplace(replacedText,REGEX_EDITOR, (match, i) => (
        <span key={match + i} className="comment-tag"><strong>{match}</strong></span>
    ));

    return replacedText;
}

function parseVideoTime(text, onClick) {
    return reactStringReplace(text || "", /^@VT{(.+)}/i, (match, i) => {
        let time = Math.floor(match);
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time % 3600) / 60);
        let seconds = Math.floor(time % 60);

        return (
            <span key={match + time} style={{cursor: "pointer", textDecoration: "underline", color: "#ff7700"}} onClick={onClick.bind(this, time)}>
                <strong>
                    {hours ? `${hours}:`.padStart(2, "0") : ""}{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </strong>
            </span>
        );
    });
}

function uniqueComments(comments) {
    return _.uniqBy(comments, 'note_id');
}

export default (props) => {
    const [state, setState] = useState({ ...INITIAL_STATE, me: props.me, cardId: props.cardId });
    const [comment, setComment] = useState("");

    useInterval(loopLoadComments, props.poll ? (process.env.REACT_APP_COMMENT_REFRESH_TIMEOUT || 5000) : null);

    useEffect(() => {
        loopLoadComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.cardId]);

    function loopLoadComments() {
        axiosClient.get(`/api/card/${state.cardId}/comments`, {
            params: {
                since: convertLocalToServerTime(new Date(state.lastUpdated)),
                order: "desc"
            },
        }).then(({data}) => {
            if(_.isEmpty(data)) {
                return;
            }

            let mostRecentTime = Math.max(state.lastUpdated, parseSqlDateTime(convertServerToLocalTime(data[0].date_added)).getTime());
            setState(prev => ({
                ...prev,
                comments: uniqueComments(data.concat(prev.comments)),
                lastUpdated: mostRecentTime
            }));
        }).catch(err => {
            warningToast("Unable to refresh comments");
            console.error(err);
        });
    }

    function send() {
        if(!comment || comment === '') {
            return;
        }

        let note = comment;
        const video = document.querySelector('#preview-vid');
        if(video && video.duration) {
            note = `@VT{${video.currentTime}} ${note}`;
        }

        axiosClient.post(`/api/card/${state.cardId}/comment`, { card_id: state.cardId, note: note})
            .then(({data}) => {
                setState(prev => {
                    let newList = [{
                        note_id: data.id,
                        note: note,
                        date_added: convertLocalToServerTime(new Date()),
                        note_by_id: state.me.client_id,
                        firstname: state.me.firstname,
                        lastname: state.me.lastname,
                    }].concat(prev.comments);

                    return {...prev, comments: uniqueComments(newList)};
                });
                setComment("");
            }).catch(err => {
                console.error(err);
                errorToast("Unable to post comment, try again later");
            });
    }

    function onSeek(time) {
        let video = document.querySelector('#preview-vid');
        video.currentTime = time;
        video.play();
    }
    
    const [index, setIndex] = useState(1);

    return (
        <Container>
            <Divider/>
            <Row style={{marginTop: "1em"}}>
                <Col s={12}><h5><MdComment style = {{ float : 'left' ,marginTop : '2px' ,marginRight:'5px'}} size = '25px' />Chat</h5></Col>
            </Row>
            <Divider/>
            <Row className="center-align">
                <Pagination
                    activePage={index}
                    items={10}
                    leftBtn={<Icon>chevron_left</Icon>}
                    maxButtons={Math.ceil(state.comments.length/10.0)}
                    rightBtn={<Icon>chevron_right</Icon>}
                    onSelect={i => setIndex(i)}
                />
            </Row>
            <Row style={{padding: "0 10px 0 10px"}}>
                {
                    state.comments.slice((index-1)*10, index*10).reverse().map(cmnt => {
                        let myComment = cmnt.note_by_id === state.me.client_id;
                        return (<Row key={cmnt.note_id} className={myComment ? "align-right" : "align-left"}>
                            <Col s={1} push={myComment ? "s11" : ""}>
                                <img src={cmnt.profile_img || Profile} alt="avatar" 
                                     style={{ pointerEvents: 'none',userSelect :"none" ,verticalAlign: "middle", width: "36px", height: "36px", borderRadius: "50%", marginTop: "5px"}}/>
                            </Col>
                            <Col s={11} pull={myComment ? "s1" : ""} className={myComment ? "m_box_me" : "m_box"}>
                                <div>
                                    <p className="chat_bubble">
                                        <b>{cmnt.firstname} {cmnt.lastname}</b> on <time>{convertServerToLocalTime(cmnt.date_added)}</time>
                                        <br/>
                                        <br/>
                                        {breakNewLines(makeLinks(highlightTags(parseVideoTime(cmnt.note, onSeek))))}
                                    </p>
                                </div>
                            </Col>
                        </Row>);
                    })
                }
            </Row>
            <Row>
                <Textarea s={10} value={comment} onChange={e => setComment(e.target.value)} icon={<Icon>short_text</Icon>}
                          placeholder="Type @Admin/@Editor/@Client to tag them!"/>
                <Col s={2}><Button icon={<Icon left>send</Icon>} onClick={send} large flat/></Col>
            </Row>
        </Container>
    );
}
