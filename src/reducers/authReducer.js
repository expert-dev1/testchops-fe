import {FETCH_USER, FETCHING_USER, TOKEN_EXPIRED, USER_LOGOUT} from "../actions/types";

export default function (state = { loggedIn: false }, {payload, type}) {
    switch (type) {
        case FETCHING_USER:
            return { ...state, loading: true };
        case FETCH_USER:
            let loggedIn = false;
            let loggedInUser = null;
            if(payload.status < 300 && payload.status >= 200) {
                loggedIn = true;
                loggedInUser = payload.data;
            }
            return { ...state, loggedIn, loggedInUser, loading: false };
        case USER_LOGOUT:
            if(payload.status >= 200 && payload.status < 300) {
                return {
                    loggedIn: false
                };
            }
            return state;
        case TOKEN_EXPIRED:
            return { loggedIn: false };
        default:
            return state;
    }
}