import React, {useState} from "react";
import {errorToast, isAdmin, isCustomer, successToast} from "../api/Util";
import {Button, Icon} from "react-materialize";
import ConfirmationDialog from "./ConfirmationDialog";
import {axiosClient} from "../api/httpClient";
import {connect} from "react-redux";
import {DONE} from "../api/Constants";

const replaceString = require('react-string-replace');
const actions = require('../actions');

export default connect(null, actions)(({me, card, fetchCards}) => {
    if(!(card?.card_status === DONE && (isAdmin(me) || (isCustomer(me) && card?.is_complete)))) {
        return null;
    }

    const [confirmationOpen, setConfirmationOpen] = useState(false);

    function onConfirmReview() {
        axiosClient.post(`/api/card/${card.card_id}/archive`)
            .then(({data}) => {
                successToast(data.success || "Card moved to archive successfully");
                fetchCards();
            }).catch(err => {
                errorToast("Something went wrong, please try again");
                console.error(err);
            });
    }

    return (
        <Button className="btn-secondary" icon={<Icon left>archive</Icon>}
                onClick={() => setConfirmationOpen(true)}>
            Archive
            <ConfirmationDialog
                onNegative={() => setConfirmationOpen(false)}
                onPositive={onConfirmReview}
                confirmationHeader="Archive"
                confirmationDialogId={"confirm-archive-" + card.card_id}
                confirmation={confirmationOpen}
                confirmationText={replaceString("Moving card \"PLCHLDR\" to archive.\nAre you sure you want to proceed?",
                    /(PLCHLDR)/,
                    (match, i) => (<strong key={match + i}>{card.card_title}</strong>))}
            />
        </Button>
    );
});
