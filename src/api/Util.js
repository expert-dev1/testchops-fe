import {toast} from "react-toastify";
import moment from 'moment-timezone';
import {
    ADMIN,
    ARCHIVED,
    CANCELED,
    CUSTOMER,
    DONE,
    EDITING,
    ON_HOLD,
    QA,
    QA_USER,
    TEAM_LEAD,
    VIDEO_REQUEST,
    YT_HELPER,
    YT_HELPER_LEAD
} from "./Constants";
import React from "react";
import {axiosClient} from "./httpClient";

const reactStringReplace = require('react-string-replace');

export const generateRandomPassword = () => {
    let length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    let i = 0, n = charset.length;
    for (; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

const TOAST_OPTIONS = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
};

export const commonToast = (message, progress = undefined) => {
    return toast(message, {...TOAST_OPTIONS, progress});
};

export const warningToast = (message, progress = undefined) => {
    return toast.warning(message, {...TOAST_OPTIONS, progress});
};

export const errorToast = (message, progress = undefined) => {
    return toast.error(message, {...TOAST_OPTIONS, progress});
};

export const successToast = (message, progress = undefined) => {
    return toast.success(message, {...TOAST_OPTIONS, progress});
};

export const infoToast = (message, progress = undefined) => {
    return toast.info(message, {...TOAST_OPTIONS, progress});
};

export const updateToast = (toastId, progress = undefined) => {
    toast.update(toastId, { progress });
};

export const finishToast = (toastId) => toast.done(toastId);

export const resize = (arr, newSize, defaultValue) => {
    return [ ...arr, ...Array(Math.max(newSize - arr.length, 0)).fill(defaultValue)];
};

const SERVER_TIME_ZONE = process.env.REACT_APP_TIMEZONE || "America/Kentucky/Louisville";
const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const DATETIME_ISO_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const DATE_ISO_FORMAT = 'YYYY-MM-DD';

export const convertLocalToServerTime = (time) => {
    return moment(time, DATETIME_ISO_FORMAT).tz(SERVER_TIME_ZONE).format(DATETIME_ISO_FORMAT);
}

export const convertServerToLocalTime = (time) => {
    return moment.tz(time, SERVER_TIME_ZONE).clone().tz(LOCAL_TIME_ZONE).format(DATETIME_ISO_FORMAT);
}

export const toISODateTime = (date) => {
    return moment(date).format(DATETIME_ISO_FORMAT);
}

export const toISODate = (date) => {
    return moment(date).format(DATE_ISO_FORMAT);
}

export const dateFormatISO = (time) => {
    return moment(time, DATETIME_ISO_FORMAT).format(DATETIME_ISO_FORMAT);
}

export const cardInProgress = card => {
    return card.card_status === EDITING || card.card_status === QA || (card.card_status === DONE && !card.is_complete);
}

export const isCustomer = (user) => {
    return user?.client_type === CUSTOMER;
}
export const isAdmin = (user) => {
    return user?.client_type === ADMIN;
}
export const isTeamLead = (user) => {
    return user?.client_type === TEAM_LEAD || user?.client_type === YT_HELPER_LEAD;
}
export const isEditor = (user) => {
    return user?.client_type === QA_USER || user?.client_type === YT_HELPER;
}

export const isTerminal = (cardStatus) => {
    return cardStatus === CANCELED || cardStatus === DONE || cardStatus === ARCHIVED;
}

const formatStringToCamelCase = str => {
    const split = str.split("-");
    if (split.length === 1) return split[0];
    return (
        split[0] +
        split.slice(1)
            .map(word => word[0].toUpperCase() + word.slice(1))
            .join("")
    );
};

export const cssStringToObj = str => {
    const style = {};
    str.split(";").forEach(el => {
        const [property, value] = el.split(":");
        if (!property) return;

        const formattedProperty = formatStringToCamelCase(property.trim());
        style[formattedProperty] = value.trim();
    });

    return style;
};

export const isTrue = val => {
    return val === "true" || val === 1 || val === true || val === "1";
}

export function validURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

export const canMoveCard = (user, status, paused, complete) => {
    return cardMovementMap[user.client_type][status || "NA"] && (!(paused || complete) || (isAdmin(user) || isTeamLead(user)));
}

export const canAcceptCard = (user, status, newStatus) => {
    return cardMovementMap[user.client_type][status || "NA"][newStatus || "NA"];
}

const cardMovementMap = {
    [ADMIN]: {
        "NA": false,
        [VIDEO_REQUEST]: {
            [VIDEO_REQUEST]: true,
            [EDITING]: true,
            [CANCELED]: true
        },
        [ON_HOLD]: {
            [EDITING]: true,
            [CANCELED]: true
        },
        [EDITING]: {
            [ON_HOLD]: true,
            [QA]: true,
            [CANCELED]: true
        },
        [QA]: {
            [ON_HOLD]: true,
            [EDITING]: true,
            [DONE]: true,
            [CANCELED]: true
        },
        [DONE]: {
            [VIDEO_REQUEST]: true,
            [ON_HOLD]: true,
            [CANCELED]: true
        },
        [CANCELED]: false
    },
    [TEAM_LEAD]: {
        "NA": false,
        [VIDEO_REQUEST]: {
            [EDITING]: true,
            [CANCELED]: true
        },
        [ON_HOLD]: {
            [EDITING]: true,
            [CANCELED]: true
        },
        [EDITING]: {
            [ON_HOLD]: true,
            [QA]: true,
            [CANCELED]: true
        },
        [QA]: {
            [ON_HOLD]: true,
            [EDITING]: true,
            [DONE]: true,
            [CANCELED]: true
        },
        [DONE]: {
            [VIDEO_REQUEST]: true,
            [ON_HOLD]: true,
            [CANCELED]: true
        },
        [CANCELED]: false
    },
    [YT_HELPER_LEAD]: {
        "NA": false,
        [VIDEO_REQUEST]: {
            [EDITING]: true,
            [CANCELED]: true
        },
        [ON_HOLD]: {
            [EDITING]: true,
            [CANCELED]: true
        },
        [EDITING]: {
            [ON_HOLD]: true,
            [QA]: true,
            [CANCELED]: true
        },
        [QA]: {
            [ON_HOLD]: true,
            [EDITING]: true,
            [DONE]: true,
            [CANCELED]: true
        },
        [DONE]: {
            [VIDEO_REQUEST]: true,
            [ON_HOLD]: true,
            [CANCELED]: true
        },
        [CANCELED]: false
    },
    [QA_USER]: {
        "NA": false,
        [VIDEO_REQUEST]: {
            [EDITING]: true
        },
        [ON_HOLD]: {
            [EDITING]: true,
        },
        [EDITING]: {
            [ON_HOLD]: true,
            [QA]: true
        },
        [QA]: {
            [ON_HOLD]: true,
            [DONE]: true
        },
        [DONE]: {
            [VIDEO_REQUEST]: false,
            [ON_HOLD]: false,
            [EDITING]: false,
            [CANCELED]: false,
        },
        [CANCELED]: false
    },
    [YT_HELPER]: {
        "NA": false,
        [VIDEO_REQUEST]: {
            [EDITING]: true
        },
        [ON_HOLD]: {
            [EDITING]: true,
        },
        [EDITING]: {
            [ON_HOLD]: true,
            [QA]: true
        },
        [QA]: {
            [ON_HOLD]: true,
            [DONE]: true
        },
        [DONE]: false,
        [CANCELED]: false
    },
    [CUSTOMER]: {
        "NA": false,
        [VIDEO_REQUEST]: {
            [VIDEO_REQUEST]: true,
            [CANCELED]: true
        },
        [ON_HOLD]: false,
        [EDITING]: false,
        [QA]: false,
        [DONE]: {
            [VIDEO_REQUEST]: true
        },
        [CANCELED]: false
    },
};

export const caMoveRepurposeCard = (user, status) => {
    return cardSubMovementMap[user.client_type][status || "NA"] || isAdmin(user) || isTeamLead(user);
}

export const canAcceptRepurposeCard = (user, status, newStatus) => {
    return cardSubMovementMap[user.client_type][status || "NA"][newStatus || "NA"];
}

const cardSubMovementMap = {
    [ADMIN]: {
        "NA": false,
        [VIDEO_REQUEST]: false,
        [ON_HOLD]: false,
        [EDITING]: {
            [DONE]: true,
        },
        [QA]: false,
        [DONE]: {
            [EDITING]: true,
        },
    },
    [TEAM_LEAD]: {
        "NA": false,
        [VIDEO_REQUEST]: false,
        [ON_HOLD]: false,
        [EDITING]: {
            [DONE]: true,
        },
        [QA]: false,
        [DONE]: {
            [EDITING]: true,
        },
    },
    [YT_HELPER_LEAD]: {
        "NA": false,
        [VIDEO_REQUEST]: false,
        [ON_HOLD]: false,
        [EDITING]: {
            [DONE]: true,
        },
        [QA]: false,
        [DONE]: {
            [EDITING]: true,
        },
    },
    [QA_USER]: {
        "NA": false,
        [VIDEO_REQUEST]: false,
        [ON_HOLD]: false,
        [EDITING]: {
            [DONE]: true,
        },
        [QA]: false,
        [DONE]: {
            [EDITING]: true,
        },
    },
    [YT_HELPER]: {
        "NA": false,
        [VIDEO_REQUEST]: false,
        [ON_HOLD]: false,
        [EDITING]: {
            [DONE]: true,
        },
        [QA]: false,
        [DONE]: {
            [EDITING]: true,
        },
    },
    [CUSTOMER]: {
        "NA": false,
        [VIDEO_REQUEST]: false,
        [ON_HOLD]: false,
        [EDITING]: false,
        [QA]: false,
        [DONE]: {
            [EDITING]: true
        },
        [CANCELED]: false
    },
};

export function parseSqlDateTime(dateTime) {
    let parts = dateTime.split(/[- :]/);

    return  new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]);
}

// https://gist.github.com/roydejong/fb021a973160fa3d04d7aaca675a46cf
export function isTouchDevice() {
    try {
        let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

        let mq = function (query) {
            return window.matchMedia(query).matches;
        };

        if (('ontouchstart' in window) || (typeof window.DocumentTouch !== "undefined" && document instanceof window.DocumentTouch)) {
            return true;
        }

        return mq(['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join(''));
    } catch (e) {
        console.error('(Touch detect failed)', e);
        return false;
    }
}

export function modifiedOrNull(newVal, oldVal) {
    return newVal !== oldVal ? newVal : null;
}

export function getUserOptions(users, clientType, showType = false) {
    return (users || []).filter(user => !clientType || user.client_type === clientType)
        .map((user) => (
            <option key={`${clientType}-${user.client_id}`} value={`${user.client_id}`}>
                {user.fullname}{showType ? ` (${user.client_type})` : ""}
            </option>
        ));
}

export async function uploadMedia(blob, clientId, progressToast) {
    let url = null;
    if (blob.size) {
        try {
            const data = new FormData();
            data.append('name', `media-${clientId}-${new Date().toString()}`);
            data.append('document', blob, `media-${clientId}-${new Date().toString()}`);

            const response = await axiosClient.post('/api/media', data, {
                onUploadProgress: (pE) => progressToast ? updateToast(progressToast,  (pE.loaded / pE.total)) : false,
                headers: {
                    'Content-Type': `multipart/form-data;`,
                },
                timeout: 30000,
            });
            url = response.data?.url;
        } catch (err) {
            console.error(err);
            warningToast("Something went wrong in uploading");
        }
    }
    return url;
}

// https://www.codexworld.com/export-html-table-data-to-csv-using-javascript/
export function exportTableToCSV(tableId, filename) {
    let csv = [];
    let rows = document.querySelectorAll(`#${tableId} tr`);

    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");

        for (let j = 0; j < cols.length; j++)
            row.push(cols[j].innerText);

        csv.push(row.join(","));
    }

    // Download CSV file
    downloadCSV(csv.join("\n"), filename);
}

function downloadCSV(csv, filename) {
    let csvFile;
    let downloadLink;
    // CSV file
    csvFile = new Blob([csv], {type: "text/csv"});
    // Download link
    downloadLink = document.createElement("a");
    // File name
    downloadLink.download = filename;
    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);
    // Hide download link
    downloadLink.style.display = "none";
    // Add the link to DOM
    document.body.appendChild(downloadLink);
    // Click download link
    downloadLink.click();
}

export function onSortTable(list, setList, key, order, setOrder) {
    if(order === 'asc') {
        order = 'desc';
    } else {
        order = 'asc';
    }
    sortList(list, setList, key, order);
    setOrder(order);
}

function sortList(list, setList, key, order) {
    let newList = list.sort((a,b) => ((a[key] > b[key]) ? 1 : -1) * (order === 'asc' ? 1 : -1));
    setList(newList);
}

// eslint-disable-next-line
export const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])/g;

export function breakNewLines(text) {
    return reactStringReplace(text, /(\\r?\\n)/g, (match, i) => (
        <br key={match + i}/>
    ));
}