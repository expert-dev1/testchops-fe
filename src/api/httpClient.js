import axios from 'axios';
import {TOKEN_EXPIRED} from "../actions/types";

const instance = axios.create();

export const setAuthToken = token => {
    if (token) {
        //applying token
        localStorage.setItem("Authorization", token);
        instance.defaults.headers.common['Authorization'] = token;
    } else {
        localStorage.removeItem("Authorization");
        //deleting the token from header
        delete instance.defaults.headers.common['Authorization'];
    }
}
export const setUpInterceptors = (store) => {
    // Add a response interceptor
    instance.interceptors.response.use( (response) => {
        return response;
    }, (error) => {
        //catches if the session ended!
        if ( error?.response?.data?.error === 'Not logged in' || error?.response?.status === 401) {
            setAuthToken();
            store.dispatch({ type: TOKEN_EXPIRED });
        }
        return Promise.reject(error);
    });

}

export const axiosClient = instance;
