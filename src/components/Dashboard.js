import React, {useEffect, useState} from "react";
import {Button, Card, Container, Dropdown, Icon, ProgressBar, Tab, Table, Tabs} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import {errorToast, toISODate} from "../api/Util";
import {DateRangePicker} from 'react-date-range';
import Graph from "./Graph";
import {buildStyles, CircularProgressbar} from 'react-circular-progressbar';
import StatsTable from "./UserStats";
import VideoBreakdown from "./VideoBreakdown";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export default () => {
    const [loading, setLoading ] = useState(false);
    const [data, setData] = useState({});
    const [startDate, setStartDate] = useState(addDays(new Date(),-7));
    const [endDate, setEndDate] = useState(new Date());

    const loadData = () => {
        setLoading(true);
        axiosClient.get('/api/dashboard', {
            params: {
                start_date: toISODate(startDate),
                end_date: toISODate(endDate),
            },
        })
            .then(response => setData(response.data))
            .catch(err => {
                console.error(err);
                errorToast("Something went wrong while loading data");
            }).finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    function onDateChange(dates) {
        setStartDate(dates.selection.startDate);
        setEndDate(dates.selection.endDate);
    }

    function videoRequests() {
        return <CircularProgressbar value={100} text={data?.video_stats?.total}
                                    styles={buildStyles({pathColor: '#0058EE'})} />;
    }

    function completedVideos() {
        let completed = data?.video_stats?.total - data?.video_stats?.in_progress;
        return <CircularProgressbar text={completed} value={(completed / Math.max(data?.video_stats?.total, 1))*100}
                                    styles={buildStyles({pathColor: 'green'})} />;
    }

    function completionTime() {
        return <CircularProgressbar text={data?.video_stats?.avg_time?.toFixed(2) + " hours"} value={100}
                                    styles={buildStyles({pathColor: '#0058EE', textSize: '0.7rem',})} />;
    }

    function avgRating() {
        return <CircularProgressbar text={`${data?.video_stats?.avg_rating?.toFixed(1)} (${data?.video_stats?.rated_videos} ratings)`}
                                    value={Math.ceil((data?.video_stats?.avg_rating * 100.0 ) / 5.0)}
                                    styles={buildStyles({pathColor: 'red', textSize: '0.7rem',})} />;
    }

    function inProgress() {
        return <CircularProgressbar value={Math.ceil((data?.video_stats?.in_progress * 100.0 ) / data?.video_stats?.total)}
                                    text={data?.video_stats?.in_progress} styles={buildStyles({pathColor: 'green'})} />;
    }

    function overdueVideos() {
        return <CircularProgressbar value={Math.ceil((data?.video_stats?.overdue * 100.0 ) / data?.video_stats?.total)}
                                    text={data?.video_stats?.overdue} styles={buildStyles({pathColor: 'red'})} />;
    }

    return <Container>
        { loading && <ProgressBar /> }
        <Card>
            <Dropdown
                options={{
                    autoTrigger: false,
                    constrainWidth: false,
                    coverTrigger: false,
                    closeOnClick: false,
                }}
                trigger={<Button node="button" className="btn-primary" icon={<Icon left>date_range</Icon>}>
                    {toISODate(startDate)} ~ {toISODate(endDate)}
                </Button>}
            >
                <DateRangePicker
                    ranges={[{
                        startDate,
                        endDate,
                        key: 'selection',
                    }]}
                    direction="horizontal"
                    fixedHeight={true}
                    months={2}
                    onChange={onDateChange} />
            </Dropdown>
        </Card>
        <Card style={{overflowX: 'scroll'}}>
            <table style={{minWidth: '840px'}}>
                <thead>
                <tr>
                    <th className="center-align" width="16%">Requested Videos</th>
                    <th className="center-align" width="16%">Completed Videos</th>
                    <th className="center-align" width="16%">Avg Completion Time</th>
                    <th className="center-align" width="16%">Avg Rating</th>
                    <th className="center-align" width="16%">In Progress</th>
                    <th className="center-align" width="16%">Overdue Videos</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>{videoRequests()}</td>
                    <td>{completedVideos()}</td>
                    <td>{completionTime()}</td>
                    <td>{avgRating()}</td>
                    <td>{inProgress()}</td>
                    <td>{overdueVideos()}</td>
                </tr>
                </tbody>
            </table>
        </Card>
        <Card>
            <Graph data={[{key: 'Videos Created', plot: data?.video_stats?.created || {}, borderColor: 'rgb(255, 99, 132)', background: 'rgb(255, 99, 132)'},
                {key: 'Videos Completed', plot: data?.video_stats?.done || {}, borderColor: 'rgb(75, 192, 192)', background: 'rgb(75, 192, 192)'}]}/>
        </Card>
        <Tabs options={{responsiveThreshold: Infinity}}>
            <Tab title="QA">
                <StatsTable data={{ ...data?.editor_stats, names: data?.editor_stats?.editors }} title="Team Performance"
                            start={toISODate(startDate)} end={toISODate(endDate)}/>
            </Tab>
            <Tab
                options={{
                }}
                title="Customer"
            >
                <Card title="Customer Averages">
                    <Table responsive={true} hoverable={true}>
                        <thead>
                        <tr>
                            <th>Total Customers</th>
                            <th>Request/Customer</th>
                            <th>Completed/Customer</th>
                            <th>Time/Customer</th>
                            <th><FontAwesomeIcon icon="star" color="#FFD700" size="xs" title="☆"/>Rating/Customer</th>
                            <th>Total Ratings</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td >{data?.customer_stats?.unique_customers}</td>
                            <td >{data?.customer_stats?.average_requests?.toFixed(2)}</td>
                            <td >{data?.customer_stats?.average_completed?.toFixed(2)}</td>
                            <td >{data?.customer_stats?.average_time?.toFixed(2)} hours</td>
                            <td >{data?.customer_stats?.average_rating?.toFixed(2)}</td>
                            <td >{data?.customer_stats?.total_ratings}</td>
                        </tr>
                        </tbody>
                    </Table>
                </Card>
                <StatsTable data={{ ...data?.customer_stats, names: data?.customer_stats?.customers }} title="Customer Stats"
                            start={toISODate(startDate)} end={toISODate(endDate)}/>
            </Tab>
        </Tabs>
        <VideoBreakdown data={data?.all_videos} start={toISODate(startDate)} end={toISODate(endDate)}/>
    </Container>;
}
