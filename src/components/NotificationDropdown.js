import React, {useCallback, useEffect, useState} from "react";
import {Divider, Dropdown} from "react-materialize";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Link} from "react-router-dom";
import {axiosClient} from "../api/httpClient";
import useInterval from "../hooks/UseInterval";
import {convertServerToLocalTime, parseSqlDateTime} from "../api/Util";
import PubSub from 'pubsub-js';
import {CARD_CLICKED} from "../api/Events";

function countUnread(notifications, myId) {
    return notifications.reduce((unread, notification) => unread + isUnread(notification, myId), 0);
}

function isUnread(notification, myId) {
    return !notification.seen && notification.recipient_client_id === myId;
}

export default ({ me })  => {
    const [notifications, setNotifications] = useState([]);
    const myId = me.client_id;

    const fetchNotifications = useCallback(() => {
        axiosClient.get("/api/notifications")
            .then(({data}) => {
                setNotifications(data.notifications);
            }).catch(err => {
                console.error(err);
            });
    }, []);

    useInterval(fetchNotifications, 60000);

    useEffect(() => {
        if(me) {
            fetchNotifications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me]);

    function markAsRead() {
        if (countUnread(notifications, myId)) {
            axiosClient.post("/api/notifications/read")
                .then(() => {})
                .catch(err => {
                    console.error(err);
                });
        }
    }

    const cardIdRegex = /^.*card-(\d+)/gm;

    return (
        <Dropdown
            id="notificationDropdown"
            options={{
                coverTrigger: false,
                onOpenEnd: markAsRead,
                constrainWidth: false,
            }}
            trigger={<a href="/#"><FontAwesomeIcon icon="bell"/>&nbsp;&nbsp;({ countUnread(notifications, myId) })</a>}
        >
            {
                React.Children.toArray(notifications.flatMap(notification => {
                    let cardId = (cardIdRegex.exec(notification.action_link) || [])[1];
                    return [
                        <Link to={"/"} className={isUnread(notification, myId) ? "unread": ""}
                              onClick={() => cardId ? setTimeout(PubSub.publish.bind(this, CARD_CLICKED, cardId), 500) : true}>
                            {notification.data}
                            <br/>
                            <strong>{parseSqlDateTime(convertServerToLocalTime(notification.created_at)).toString()}</strong>
                        </Link>,
                        <Divider/>
                    ];
                }))
            }
        </Dropdown>
    );
}
