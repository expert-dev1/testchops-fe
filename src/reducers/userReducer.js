import {
    ADD_CUSTOMER,
    ADD_USER,
    FETCH_ALL_CUSTOMERS,
    FETCH_ALL_USERS,
    FETCHING_ALL_CUSTOMERS,
    FETCHING_ALL_USERS,
    REMOVE_CUSTOMER,
    REMOVE_USER
} from "../actions/types";
import * as _ from 'lodash';
import {QA_USER} from "../api/Constants";

export default function (state = {}, {payload, type}) {
    switch (type) {
        case FETCHING_ALL_USERS:
            return {...state, loadingUsers: true};
        case FETCH_ALL_USERS:
            if (payload.status < 300 && payload.status >= 200) {
                let qas = payload.data.filter(user => user.client_type === QA_USER);
                return {...state, users: payload.data, qas, loadingUsers: false};
            }
            return {...state, loadingUsers: false};
        case FETCHING_ALL_CUSTOMERS:
            return {...state, loadingCustomers: true};
        case FETCH_ALL_CUSTOMERS:
            if (payload.status < 300 && payload.status >= 200) {
                return {...state, customers: payload.data, loadingCustomers: false};
            }
            return {...state, loadingCustomers: false};
        case ADD_USER:
            return {...state, users: _.concat([payload], state.users || [])};
        case ADD_CUSTOMER:
            return {...state, customers: _.concat([payload], state.customers || [])};
        case REMOVE_USER:
            return {
                ...state, users: (state.users || [])
                    .filter(user => Number(user.client_id) !== Number(payload.client_id))
            }
        case REMOVE_CUSTOMER:
            return {
                ...state, customers: (state.customers || [])
                    .filter(user => Number(user.client_id) !== Number(payload.client_id))
            }
        default:
            break;
    }
    return state;
}