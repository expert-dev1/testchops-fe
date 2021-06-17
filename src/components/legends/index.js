import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export const DueDateLegend = () => {
    return (
        <FontAwesomeIcon icon="hourglass-end" color="red" size="lg"/>
    );
};

export const CreationDateLegend = () => {
    return (
        <FontAwesomeIcon icon="plus" color="#1976d2" size="lg"/>
    );
};

export const TimelineLegend = () => {
    return (
        <FontAwesomeIcon icon="clock" color="black" size="lg"/>
    );
};

export const PersonLegend = () => {
    return (
        <FontAwesomeIcon icon="user" size="lg"/>
    );
};

export const SubscriptionLegend = () => {
    return (
        <FontAwesomeIcon icon="tag" size="lg"/>
    );
};

export const CommentsLegend = () => {
    return (
        <FontAwesomeIcon icon={["far", "comments"]} size="lg"/>
    );
};

export const TimerLegend = () => {
    return (
        <FontAwesomeIcon icon="stopwatch" size="lg"/>
    );
}
