import React from "react";
import {cardInProgress, errorToast, infoToast, isAdmin, successToast} from "../api/Util";
import {Button} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import {ON_HOLD} from "../api/Constants";

import {MdPause,MdPlayArrow} from 'react-icons/md'

export default ({me, card, refresh}) => {

    if(!isAdmin(me) || (!cardInProgress(card) && card.card_status !== ON_HOLD)) {
        return null;
    }

    async function pauseResumeCard() {
        let paused = card.paused;
        infoToast("Processing");
        return axiosClient.put(`/api/v2/card/${card.card_id}`, {paused: paused ? 0 : 1})
            .then(({data}) => {
                successToast(data.success || `Card ${paused ? "Resumed" : "Paused"} Successfully`);
                return refresh();
            }).catch(err => {
                errorToast("Something went wrong, please try again");
                console.error(err);
            });
    }

    return (
        <Button className="btn-secondary" icon={card.paused ? <MdPlayArrow style = {{ float : 'left' ,marginTop : '8px' ,marginRight:'5px'}} size ='20px'/> : <MdPause style = {{ float : 'left' ,marginTop : '8px' ,marginRight:'5px'}} size = '20px'/>}
                onClick={pauseResumeCard}>
            {card.paused ? "Resume" : "Pause"}
        </Button>
    );
};
