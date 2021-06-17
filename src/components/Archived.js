import React, {useEffect, useState} from "react";
import {Button, Card, Col, Container, Icon, Pagination, Row, Select} from "react-materialize";
import axios from "axios";
import {axiosClient} from "../api/httpClient";
import {connect} from "react-redux";
import {errorToast, getUserOptions, infoToast, isCustomer} from "../api/Util";
import {moveCard} from "../api/CardActions";
import {ARCHIVED, DONE} from "../api/Constants";
import CardModal from "./CardModal";

const cancelTokenSource = axios.CancelToken.source();

export default connect(mapStateToProps)((props) => {

    const loggedInUser = props?.auth?.loggedInUser || {};
    const customer = isCustomer(loggedInUser);
    const [cards, setCards] = useState([]);
    const [index, setIndex] = useState(1);
    const [viewFor, setViewFor] = useState("0");
    const [loading, setLoading] = useState(false);
    const [viewCardId, setViewCardId] = useState(0);
    const [viewCardOpen, setViewCardOpen] = useState(false);
    const limit = 10;

    const refresh = () => {
        if(loading) {
            return;
        }
        setLoading(true);
        infoToast("Loading");
        axiosClient.get('/api/cards/archive', {
            cancelToken: cancelTokenSource.token,
            params: {
                limit: limit,
                page: index - 1,
                client_id: Number(viewFor)
            }
        })
            .then(({data}) => setCards(data))
            .catch(err => {
                if (!axios.isCancel(err)) {
                    errorToast("Something went wrong");
                    console.error(err);
                }
            }).finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, viewFor]);

    function unArchive(cardId) {
        infoToast("Please wait");
        moveCard(cardId, DONE, ARCHIVED);
    }
    const showCard = (cardId) => {
        setViewCardId(cardId);
        setViewCardOpen(true);
    }

    return (
        <Container>
            <CardModal cardId={viewCardId} isOpen={viewCardOpen} onClose={setViewCardOpen.bind(this, false)}
                       me={loggedInUser} />
            <Card
                title={<Row>
                    <Col s={6} m={3}>Archived Cards</Col>
                    {
                        !customer ?
                            <Select s={6} m={3}
                                    style={{margin: 0, padding: 0}}
                                    key="select-customer-archive"
                                    value={viewFor}
                                    onChange={e => setViewFor(e.target.value)}
                            >
                                <option value="0">All</option>
                                { getUserOptions(props?.users?.customers) }
                            </Select> : ""
                    }
                </Row>}
                actions={[
                    <Button key="refresh-btn" onClick={refresh} node="button" waves="light" large flat>
                        Reload <Icon right>refresh</Icon>
                    </Button>
                ]}
            >
                <table>
                    <thead>
                    <tr>
                        <th width="15%">Customer</th>
                        <th width="40%">Card Title</th>
                        <th width="5%">Subscription</th>
                        <th width="10%">Created On</th>
                        <th width="10%">Assigned On</th>
                        <th width="10%">Done On</th>
                        <th width="10%">Archived On</th>
                        <th width="15%">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        React.Children.toArray(cards.map(card => <tr style={{cursor: "pointer"}}
                                                                     onClick={() => showCard(card.card_id)}>
                            <td>{card.client_name}</td>
                            <td>{card.card_title}</td>
                            <td>{card.subscription_type}</td>
                            <td>{card.creation_time}</td>
                            <td>{card.assigned_time}</td>
                            <td>{card.done_time}</td>
                            <td>{card.archived_time}</td>
                            <td>
                                {!customer &&
                                    <Button flat icon={<Icon>unarchive</Icon>} small tooltip="Un-Archive"
                                            onClick={() => unArchive(card.card_id)}/>
                                }
                            </td>
                        </tr>))
                    }

                    </tbody>
                </table>

                <Row className="center-align">
                    <Pagination
                        activePage={index}
                        items={limit}
                        leftBtn={<Icon>chevron_left</Icon>}
                        rightBtn={<Icon>chevron_right</Icon>}
                        onSelect={i => setIndex(i)}
                    />
                </Row>
            </Card>
        </Container>
    );
});

function mapStateToProps({auth, users}) {
    return {auth, users};
}
