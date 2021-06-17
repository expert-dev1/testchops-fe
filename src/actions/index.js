import {axiosClient} from '../api/httpClient';
import * as Types from './types';

export const fetchUser = () => async dispatch => {
    try {
        dispatch({type: Types.FETCHING_USER});
        const res = await axiosClient.get('/api/me');
        dispatch({type: Types.FETCH_USER, payload: res});
    } catch (e) {
        dispatch({type: Types.FETCH_USER, payload: e.response});
    }
};

export const logout = () => async dispatch => {
    try {
        localStorage.removeItem('access');
        const res = await axiosClient.post('/api/logout');
        dispatch({type: Types.USER_LOGOUT, payload: res});
    } catch (e) {
        dispatch({type: Types.USER_LOGOUT, payload: e.response});
    }
};

export const fetchCards = (viewAs = null) => async dispatch => {
    try {
        dispatch({type: Types.CARDS_FETCHING});
        let params = viewAs ? {
            view_as: viewAs
        } : {};
        const res = await axiosClient.get('/api/cards', { params });
        dispatch({type: Types.CARDS_FETCHED, payload: res});
    } catch (e) {
        dispatch({type: Types.CARDS_FETCHED, payload: e.response});
    }
};

export const fetchAllUsers = () => async dispatch => {
    try {
        dispatch({type: Types.FETCHING_ALL_USERS});
        const res = await axiosClient.get('/api/users');
        dispatch({type: Types.FETCH_ALL_USERS, payload: res});
    } catch (e) {
        dispatch({type: Types.FETCH_ALL_USERS, payload: e.response});
    }
};

export const fetchAllCustomers = () => async dispatch => {
    try {
        dispatch({type: Types.FETCHING_ALL_CUSTOMERS});
        const res = await axiosClient.get('/api/customers');
        dispatch({type: Types.FETCH_ALL_CUSTOMERS, payload: res});
    } catch (e) {
        dispatch({type: Types.FETCH_ALL_CUSTOMERS, payload: e.response});
    }
};

export const addUser = (user) => dispatch => {
    dispatch({type: Types.ADD_USER, payload: user});
};

export const addCustomer = (user) => dispatch => {
    dispatch({type: Types.ADD_CUSTOMER, payload: user});
};

export const removeUser = (user) => dispatch => {
    dispatch({type: Types.REMOVE_USER, payload: user});
};

export const removeCustomer = (user) => dispatch => {
    dispatch({type: Types.REMOVE_CUSTOMER, payload: user});
};

export const fetchSettings = () => async dispatch => {
    try {
        dispatch({type: Types.FETCHING_SETTINGS});
        const res = await axiosClient.get('/api/portal/settings');
        dispatch({type: Types.FETCH_SETTINGS, payload: res});
    } catch (e) {
        dispatch({type: Types.FETCH_SETTINGS, payload: e.response});
    }
};

export const updateSettings = (body) => dispatch => {
    dispatch({type: Types.UPDATE_SETTINGS, payload: body});
};
