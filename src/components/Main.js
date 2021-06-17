import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import * as actions from "../actions";
import Clock from 'react-live-clock';
import {
    Button,
    CardPanel,
    Checkbox,
    Col,
    Collapsible,
    Container,
    Dropdown,
    Icon,
    ProgressBar,
    Row,
} from "react-materialize";
import Select from 'react-select';
import * as _ from 'lodash';
import CardList from "./CardList";
import CreateCard from "./CreateCard";
import CardModal from "./CardModal";
import EditCard from "./EditCard";
import {cssStringToObj, isAdmin, isCustomer, isTeamLead} from "../api/Util";
import {CANCELED, DONE, EDITING, ON_HOLD, QA, VIDEO_REQUEST} from "../api/Constants";
import DragNDrop from "./DragNDrop";
import PubSub from 'pubsub-js';
import {CARD_CLICKED} from "../api/Events";
import {useLocation} from "react-router-dom";


export default connect(mapStateToProps, actions)((props) => {

    const [key, setKey] = useState(1);
    const [newCardRequestOpen, setNewCardRequestOpen] = useState(false);
    const [viewCardOpen, setViewCardOpen] = useState(false);
    const [editCardOpen, setEditCardOpen] = useState(false);
    const [viewCardId, setViewCardId] = useState(0);
    const [editCardId, setEditCardId] = useState(0);
    const [viewAs, setViewAsState] = useState(null);
    const [showCanceled, setShowCanceled] = useState(false);
    const [showHold, setShowHold] = useState(true);
    const [showRepurposed, setShowRepurposed] = useState(false);
    const location = useLocation();

    const loggedInUser = props.auth?.loggedInUser || {};

    const admin = isAdmin(loggedInUser);
    const customer = isCustomer(loggedInUser);
    const teamLead =isTeamLead(loggedInUser);

    const requestsLimited = customer && loggedInUser.request_limit;
    const accountPending = customer && loggedInUser.qas?.length <= 0;

    function setViewAs(v) {
        setViewAsState(v);
        refresh(v.value);
    }

    const refresh = (user) => {
        props.fetchCards(user || viewAs?.value);
    };
    const showCreateCard = () => {
        if(!(requestsLimited || accountPending)) {
            setNewCardRequestOpen(true);
        }
    }
    const showEditCard = (cardId) => {
        setEditCardId(cardId);
        setEditCardOpen(true);
    }
    const showCard = (cardId) => {
        setViewCardId(cardId);
        setViewCardOpen(true);
    }

    useEffect(() => {
        let cardId = location.hash?.replace(/#card-/i, "");
        if (cardId && (props?.cards?.cardMap || {})[cardId]) {
            showCard(cardId);
        }
    }, [props.cards.cardMap, location.hash]);

    useEffect(() => {
        const subToken = PubSub.subscribe(CARD_CLICKED, (msg, data) => showCard(data));

        if(_.isEmpty(props.settings)) {
            props.fetchSettings();
        }

        if (_.isEmpty(props.cards)) {
            refresh();
        }

        if(admin && props.users.qas == null && !props.users.loadingUsers) {
            props.fetchAllUsers();
        }
        if(teamLead && props.users.qas == null && !props.users.loadingUsers) {
            props.fetchAllUsers();
        }


        return () => PubSub.unsubscribe(subToken);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewAs, admin]);

    let cardsEmpty = _.isEmpty(props.cards);

    if (cardsEmpty) {
        return (
            <Row>
                <Col s={12}>
                    <ProgressBar/>
                </Col>
            </Row>
        );
    }

    const bannerTextStyle = Object.assign(cssStringToObj(props.settings?.banner_text_style || ""),
        {whiteSpace: "pre-wrap"}
        );

    return (
        <Container>
            <DragNDrop loggedInUser={loggedInUser} refresh={refresh} setKey={setKey}/>
            <CardModal cardId={viewCardId} isOpen={viewCardOpen} onClose={setViewCardOpen.bind(this, false)}
                       qas={props.users.qas} me={loggedInUser} />
            <EditCard cardId={editCardId} me={loggedInUser} isOpen={editCardOpen} onClose={() => setEditCardOpen(false)}/>
            <CreateCard me={loggedInUser} isOpen={newCardRequestOpen} onClose={() => {setNewCardRequestOpen(false); refresh();}}/>
            {props.cards.loading ? <Row><ProgressBar /></Row> : ""}
            {
                props.settings?.enable_banner &&
                <Row>
                    <CardPanel className="bg-warning z-depth-4">
                        <Row>
                            <Col s={12} style={cssStringToObj(props.settings?.banner_heading_style)}>
                                <p>{props.settings?.banner_heading}</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col s={12} style={bannerTextStyle}>
                                <p>{props.settings?.banner_text || ""}</p>
                            </Col>
                        </Row>
                        {
                            props.settings?.banner_image &&
                            <Row>
                                <Col s={12}>
                                    <img src={props.settings?.banner_image} alt="Banner"
                                         style={Object.assign({width: "100%", height: "auto"},
                                             cssStringToObj(props.settings?.banner_image_style))}/>
                                </Col>
                            </Row>
                        }
                    </CardPanel>
                </Row>
            }
            <Row style={{marginTop: "5px", marginBottom: "0",}} className="hide-on-med-and-down">
                <Col style={{margin: '5px', padding: 0}}>
                    <Button icon={<Icon>refresh</Icon>} tooltip="Reload Cards" onClick={refresh}
                            className="z-depth-1 center-align btn-chiclet btn-primary" style={{maxHeight: "70px"}}/>
                </Col>
                {
                    (admin || customer) &&
                    <Col style={{margin: '5px', padding: 0}}>
                        <Button icon={<Icon>add</Icon>} onClick={showCreateCard}
                                tooltip={requestsLimited ? `You have reached limit for video requests. Your limit will refresh on the next billing date. For further information contact your account manager.`
                                    : accountPending ? "Your DropBox video account is in progress, we will send you an email when we are done then you will be able create video request."
                                        : "Create New Video Request"} style={{maxHeight: "70px"}}
                                className={"z-depth-1 center-align btn-chiclet " + ((requestsLimited || accountPending)
                                    ? "btn-secondary" : "btn-primary")}/>
                    </Col>
                }
                <Col style={{margin: '5px', padding: 0}}>
                    <CardPanel style={{margin: 0, borderRadius: "8px"}}>
                        <Icon left>access_time</Icon>
                        <Clock
                            format={"dddd, DD-MMM-YYYY | hh:mm:ss"}
                            ticking={true}
                            interval={1000}
                            timezone={process.env.REACT_APP_TIMEZONE}
                        />
                    </CardPanel>
                </Col>
                {
                    (admin || isTeamLead(loggedInUser)) &&
                    <Col style={{margin: '5px', padding: 0, paddingRight: "15px"}} s={12} m={3}>
                        <Select className="z-depth-1 select-view-as"
                            value={viewAs}
                            onChange={setViewAs}
                            options={_.concat([{...loggedInUser, fullname: 'Me'}], props.users?.users || [], props.users?.customers || [])
                                .map(user => ({value: user.client_id, label: `${user.fullname} (${user.client_type})`}))
                            }
                            placeholder="View As"
                        />
                    </Col>
                }
                <Col style={{margin: '5px', padding: 0}}>
                    <CardPanel className="toggle-panel">
                        <Checkbox value="1" label="Show Canceled Cards" checked={showCanceled} id="check-canceled"
                                  onChange={setShowCanceled.bind(this, Boolean(!showCanceled))}/>
                    </CardPanel>
                </Col>
                <Col style={{margin: '5px', padding: 0}}>
                    <CardPanel className="toggle-panel">
                        <Checkbox value="2" label="Show Cards On Hold" checked={showHold} id="check-hold"
                                  onChange={setShowHold.bind(this, Boolean(!showHold))}/>
                    </CardPanel>
                </Col>
                <Col style={{margin: '5px', padding: 0}}>
                    <CardPanel className="toggle-panel">
                        <Checkbox value="2" label="Show Cards In Repurpose" checked={showRepurposed} id="check-rp"
                                  onChange={setShowRepurposed.bind(this, Boolean(!showRepurposed))}/>
                    </CardPanel>
                </Col>
            </Row>
            <Row style={{paddingLeft: "0.75rem", marginTop: "5px", marginBottom: "0",}} className="hide-on-large-only hide-on-extra-large-only">
                <Col s={2} m={4}>
                    <Dropdown
                        trigger={<Button style={{backgroundColor: "#82b150", marginTop: "5px"}} floating large icon={<Icon>more_vert</Icon>}/>}
                        options={{
                            autoTrigger: false,
                            constrainWidth: false,
                            coverTrigger: false,
                            closeOnClick: false,
                        }}>
                        {React.Children.toArray([
                            (admin || customer) && !(requestsLimited || accountPending) ?
                            <Button icon={<Icon left>add</Icon>} flat onClick={showCreateCard} style={{margin: '5px'}}>
                                Create New Request</Button> : null,
                            accountPending ?
                                <p style={{margin: '20px'}}>Your DropBox video account is in progress, we will send you an email when we are done then you will be able create video request.</p>
                                : null,
                            requestsLimited ?
                                <p style={{margin: '20px'}}>You have reached limit for video requests. Your limit will refresh on the next billing date. For further information contact your account manager.</p>
                                : null,
                            <Button icon={<Icon left>refresh</Icon>} flat onClick={refresh} style={{margin: '5px'}}>Refresh</Button>,
                            <div style={{margin: '20px'}}>
                                <Checkbox value="1" label="Show Canceled Cards" checked={showCanceled} id="check-canceled"
                                          onChange={setShowCanceled.bind(this, Boolean(!showCanceled))}/>
                            </div>,
                            <div style={{margin: '20px'}}>
                                <Checkbox value="2" label="Show Cards On Hold" checked={showHold} id="check-hold"
                                          onChange={setShowHold.bind(this, Boolean(!showHold))}/>
                            </div>,
                            <div style={{margin: '20px'}}>
                                <Checkbox value="2" label="Show Cards In Repurpose" checked={showHold} id="check-repurp-2"
                                          onChange={setShowRepurposed.bind(this, Boolean(!showRepurposed))}/>
                            </div>,
                            (admin || isTeamLead(loggedInUser)) &&
                            <Select
                                value={viewAs}
                                onChange={setViewAs}
                                options={_.concat([{...loggedInUser, fullname: 'Me'}], props.users?.users || [], props.users?.customers || [])
                                    .map(user => ({value: user.client_id, label: `${user.fullname} (${user.client_type})`}))
                                }
                                placeholder="View As"
                            />,
                        ])}
                    </Dropdown>
                </Col>
                <Col s={10} m={8}>
                    <CardPanel style={{margin: 0, fontSize: "1.2rem"}}>
                        <Icon left>access_time</Icon>
                        <Clock
                            format={"DD-MMM-YYYY hh:mm:ss"}
                            ticking={true}
                            interval={1000}
                            timezone={process.env.REACT_APP_TIMEZONE}
                        />
                    </CardPanel>
                </Col>
            </Row>
            <Row style={{overflowX: "scroll", marginBottom: "0", }}>
                <table className="cards-panel">
                    <tbody>
                        <tr>
                            <td width="25%">
                                <Collapsible className="video-requests-list" accordion>
                                    <CardList name="Video Requests" cards={props.cards?.cardList?.video_requests}
                                              viewCard={customer ? showEditCard : showCard} key={"vr-" + key}
                                              type={VIDEO_REQUEST}/>
                                </Collapsible>
                            </td>
                            {
                                showHold &&
                                <td width="25%">
                                    <Collapsible className="hold-list" accordion>
                                        <CardList name="On Hold" viewCard={showCard} cards={props.cards?.cardList?.on_hold}
                                                  type={ON_HOLD} key={"oh-" + key}/>
                                    </Collapsible>
                                </td>
                            }
                            <td width="25%">
                                <Collapsible className="editing-list" accordion>
                                    <CardList name="Editing" viewCard={showCard} cards={props.cards?.cardList?.editing}
                                              type={EDITING} key={"ed-" + key}/>
                                </Collapsible>
                            </td>
                            <td width="25%">
                                <Collapsible className="qa-list" accordion>
                                    <CardList name="QA" viewCard={showCard} cards={props.cards?.cardList?.qa_cards}
                                              type={QA} key={"qa-" + key}/>
                                </Collapsible>
                            </td>
                            <td width="25%">
                                <Collapsible className="done-list" accordion>
                                    <CardList name="Done" viewCard={showCard} cards={props.cards?.cardList?.done_cards
                                        ?.filter(card => !card.repurpose_status)}
                                              type={DONE} key={"dn-" + key}/>
                                </Collapsible>
                            </td>
                            {
                                showCanceled &&
                                <td width="25%">
                                    <Collapsible className="canceled-list" accordion>
                                                <CardList name="Canceled" viewCard={showCard} cards={props.cards?.cardList?.cancelled_cards}
                                                          type={CANCELED} key={"cn-" + key}/>
                                    </Collapsible>
                                </td>
                            }
                            {
                                showRepurposed ? React.Children.toArray([
                                        <td width="25%">
                                            <Collapsible className="repurpose-list" accordion>
                                                <CardList name="Repurposing" viewCard={showCard}
                                                          cards={props.cards?.cardList?.done_cards
                                                              ?.filter(card => card.repurpose_status === EDITING)}
                                                          rType={EDITING} key={"red-" + key}/>
                                            </Collapsible>
                                        </td>,
                                        <td width="25%">
                                            <Collapsible className="repurpose-list" accordion>
                                                <CardList name="Repurposing Done" viewCard={showCard}
                                                          cards={props.cards?.cardList?.done_cards
                                                              ?.filter(card => card.repurpose_status === DONE)}
                                                          rType={DONE} key={"rdn-" + key}/>
                                            </Collapsible>
                                        </td>,
                                    ]) : null
                            }
                        </tr>
                    </tbody>
                </table>
            </Row>
        </Container>
    );
});

function mapStateToProps({cards, auth, users, settings}) {
    return {cards, auth, users, settings};
}
