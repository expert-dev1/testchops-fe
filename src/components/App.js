import React, {Component} from 'react';
import {BrowserRouter, Route} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core'
import {
    faArchive,
    faAt,
    faBell,
    faChartLine,
    faCheck,
    faCircle,
    faClock,
    faCogs,
    faHourglassEnd,
    faIdBadge,
    faPauseCircle,
    faPlus,
    faPlusSquare,
    faQuestion,
    faRedo,
    faStar,
    faStopwatch,
    faSync,
    faTag,
    faTicketAlt,
    faUser,
    faUsers,
    faUserTag,
    faUserTie
} from "@fortawesome/free-solid-svg-icons";
import {faComments} from "@fortawesome/free-regular-svg-icons";

import Header from "./Header";
import Login from "./Login";
import Main from './Main';
import AllUsers from "./AllUsers";
import {Slide, ToastContainer} from "react-toastify";
import UserProfile from "./UserProfile";
import RequireLogin from "./RequireLogin";
import {Container} from "react-materialize";
import Signup from "./Signup";
import Settings from "./Settings";
import AllCustomers from "./AllCustomers";
import Profile from "./Profile";
import Archived from "./Archived";
import Dashboard from "./Dashboard";
import PasswordReset from "./PasswordReset";

library.add(faStar, faQuestion, faCheck, faComments, faCircle, faPlus, faHourglassEnd, faClock, faUser, faUsers, faBell,
    faChartLine, faUserTie, faArchive, faIdBadge, faCogs, faTicketAlt, faSync, faAt, faUserTag, faPauseCircle, faRedo,
    faPlusSquare, faStopwatch, faTag);

class App extends Component {

    render() {
        return (
            <Container>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    pauseOnHover
                    draggable
                    transition={Slide}
                />
                <BrowserRouter>
                    <Header/>
                    {/*Legacy endpoints*/}
                    <Route exact path="/customer/signup" component={Signup} />
                    <Route exact path="/customer/login" component={Login} />

                    <Route exact path="/login" component={Login} />
                    <Route exact path="/signup" component={Signup} />
                    <Route exact path="/password-reset" component={PasswordReset} />
                    <Route exact path="/" component={RequireLogin(Main)} />
                    <Route exact path="/customer/index" component={RequireLogin(Main)} />
                    <Route exact path="/users" component={RequireLogin(AllUsers)} />
                    <Route exact path="/customers" component={RequireLogin(AllCustomers)} />
                    <Route exact path="/user/:userId/profile" component={RequireLogin(UserProfile)} />
                    <Route exact path="/settings" component={RequireLogin(Settings)} />
                    <Route exact path="/profile" component={RequireLogin(Profile)} />
                    <Route exact path="/cards/archive" component={RequireLogin(Archived)} />
                    <Route exact path="/dashboard" component={RequireLogin(Dashboard)} />
                </BrowserRouter>
            </Container>
        );
    }
}

export default App;
