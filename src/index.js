import './styles/app.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, createStore} from "redux";
import reduxThunk from 'redux-thunk';

import App from './components/App';
import reducers from './reducers';
import {axiosClient, setAuthToken, setUpInterceptors} from "./api/httpClient";
import {FETCH_USER, FETCHING_USER} from "./actions/types";

const store = createStore(reducers, {}, applyMiddleware(reduxThunk));

let authToken = localStorage.getItem("Authorization");
setAuthToken(authToken);
setUpInterceptors(store);

if(authToken) {
    store.dispatch({type: FETCHING_USER});
    axiosClient.get('/api/me')
        .then(response => {
            store.dispatch({type: FETCH_USER, payload: response});
        }).catch(err => {
            console.error(err);
            store.dispatch({type: FETCH_USER, payload: err.response});
    });
}

ReactDOM.render(
    <Provider store={store}><App/></Provider>,
    document.querySelector('#root')
);
