import {FETCH_SETTINGS, FETCHING_SETTINGS, UPDATE_SETTINGS} from "../actions/types";
import {isTrue} from "../api/Util";

export default function (state = {}, {payload, type}) {
    switch (type) {
        case FETCHING_SETTINGS:
            return { ...state, loading: true }
        case FETCH_SETTINGS:
            if(payload.status >= 200 && payload.status < 300) {
                return {...state, ...payload.data, enable_banner: isTrue(payload.data?.enable_banner), loading: false};
            }
            return {...state, loading: false};
        case UPDATE_SETTINGS:
            return {...state, ...payload};
        default:
            return state;
    }
}