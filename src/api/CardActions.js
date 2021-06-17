import {axiosClient} from "./httpClient";
import {errorToast, successToast, warningToast} from "./Util";
import {DONE} from "./Constants";


function reportError(err) {
    console.error(err);
    errorToast("Something went wrong, please try again");
}

export function decideTimeline(revisions) {
    return revisions > 0 ? 24 : 48;
}

export function addRevision(cardId, currentStatus, callback) {
    axiosClient.post(`/api/card/${cardId}/revision`,
        {card_id: cardId, card_status: currentStatus})
        .then(({data}) => {
            successToast(data?.success || "Card moved to revision successfully");
            callback();
        }).catch(err => reportError(err));
}

export async function updateSorting(cards) {
    if (cards.length > 0) {
        return axiosClient.post('/api/cards/updateSort', {cards})
            .then(({data}) => {
                successToast(data?.success || "Information updated successfully");
            }).catch(err => reportError(err));
    }
}

export function moveCard(cardId, target, source, callback) {
    axiosClient.post(`/api/card/${cardId}/move`, {
        card_id: cardId, card_status: source, newStatus: target
    }).then(({data}) => {
        successToast(data?.success || "Card moved successfully");
        if(callback) {
            callback();
        }
    }).catch(err => reportError(err));
}

export function moveCardSubStatus(cardId, target, source, callback, additionalData = {}) {
    axiosClient.post(`/api/card/${cardId}/moveCardSub`, {
        card_id: cardId, status: target, from: source, ...additionalData
    }).then(response => {
        if(response.status !== 204) {
            successToast(response.data?.message || "Card moved successfully");
        } else {
            warningToast(response.data?.message || "Not allowed");
        }
        if(callback) {
            callback();
        }
    }).catch(err => reportError(err));
}

export function addCardTimeline(cardId, currentStatus, timeline, callback) {
    axiosClient.post(`/api/card/${cardId}/timeline`,
    {card_id: cardId, timeline, card_status: currentStatus})
        .then(({data}) => {
            successToast(data?.success || "Card moved successfully");
            callback();
        }).catch(err => reportError(err));
}

export function markAsDone(cardId, cardStatus, doneLink, callback) {
    axiosClient.post(`/api/card/${cardId}/done`, {
        card_id: cardId, card_status: cardStatus, newStatus: DONE, done_link: doneLink
    }).then(({data}) => {
        successToast(data?.success || "Card moved successfully");
    }).catch(err => reportError(err));
}
