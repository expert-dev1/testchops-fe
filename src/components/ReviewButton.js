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
    const [confirmationOpen, setConfirmationOpen] = useState(false);

    let allow = isCustomer(me) || isAdmin(me);

    if(!allow || card.card_status !== DONE || card.is_complete) {
        return "";
    }

    function onConfirmReview() {
        axiosClient.post(`/api/card/${card.card_id}/revision`,
            {card_id: card.card_id, card_status: card.card_status})
            .then(({data}) => {
                successToast(data.success || "Card moved to revision successfully");
                fetchCards();
            }).catch(err => {
                errorToast("Something went wrong, please try again");
                console.error(err);
            });
    }

    return (
        <Button className="btn-danger" icon={<Icon left>navigate_before</Icon>}
                onClick={() => setConfirmationOpen(true)} >
            Revision
            <ConfirmationDialog
                onNegative={() => setConfirmationOpen(false)}
                onPositive={onConfirmReview}
                confirmationHeader="Revision"
                confirmationDialogId={"confirm-revision-" + card.card_id}
                confirmation={confirmationOpen}
                confirmationText={replaceString("Requesting a revision for: PLCHLDR.\nAre you sure you want to proceed?", /(PLCHLDR)/,
                    (match, i) => (<strong key={match + i}>{card.card_title}</strong>))}
            />
        </Button>
    );
});
