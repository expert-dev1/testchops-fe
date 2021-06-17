import {combineReducers} from "redux";
import authReducer from "./authReducer";
import cardReducer from "./cardReducer";
import userReducer from "./userReducer";
import {USER_LOGOUT} from "../actions/types";
import {setAuthToken} from "../api/httpClient";
import settingsReducer from "./settingsReducer";

const appReducer = combineReducers({
    auth: authReducer,
    cards: cardReducer,
    users: userReducer,
    settings: settingsReducer
});

const rootReducer = (state, action) => {
    if (action.type === USER_LOGOUT) {
        state = undefined;
        setAuthToken();
    }
    return appReducer(state, action);
}

export default rootReducer;
