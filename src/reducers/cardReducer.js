import {CARDS_FETCHED, CARDS_FETCHING} from "../actions/types";
import * as _ from 'lodash';

export default function (state = {}, {payload, type}) {
    switch (type) {
        case CARDS_FETCHING:
            return { ...state, loading: true }
        case CARDS_FETCHED:
            if(payload.status >= 200 && payload.status < 300) {
                let cardMap = {};

                 _.flatten([payload.data?.video_requests, payload.data?.editing, payload.data?.qa_cards,
                     payload.data?.done_cards, payload.data?.on_hold, payload.data?.cancelled_cards])
                    .forEach(card => {
                        cardMap[card.card_id] = card;
                    });

                return {...state, cardList: payload.data, cardMap: cardMap, loading: false};
            }
            return {...state, loading: false};
        default:
            return state;
    }
}