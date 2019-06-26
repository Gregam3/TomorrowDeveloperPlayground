import React, { Component } from "react";
import { Modal, Button, Nav } from "react-bootstrap";
import JSONInput from "react-json-editor-ajrm";
import locale from "react-json-editor-ajrm/locale/en";
import ReactJsonSyntaxHighlighter from "react-json-syntax-highlighter";
import {
	Charts,
	ChartContainer,
	ChartRow,
	YAxis,
	LineChart
} from "react-timeseries-charts";
import Gauge from "react-svg-gauge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DISPLAY_TYPE = {
	JSON: 0,
	GRAPH: 1,
	AGGREGATE: 2,
	CODE_SIMILIARITY: 3
};

export class ExecutionResults extends Component {
	state = {
		resultsDisplay: DISPLAY_TYPE.JSON,
		configureRunModal: false,
		results: {},
		stateInjection: {}
	};

	temporaryStateInjection = {};
	executionRef = React.createRef();

	constructor(props) {
		super(props);
		this.interpretJS = props.interpretJS;
		this.setStateInjection = props.setStateInjection;
	}

	componentWillReceiveProps(nextProps) {
		this.authDetails = {
			username: nextProps.authDetails.username,
			password: nextProps.authDetails.password
		};
		this.setState({ results: nextProps.results });
	}

	render() {
		return (
			<div>
				{this.configureRunModal()}
				<div className="test-results panel panel-default">
					<div className="panel-header" style={{ marginLeft: "10px" }}>
						<h3>
							<FontAwesomeIcon icon="poll" />
							&nbsp; Results{" "}
							<Button
								variant="secondary"
								onClick={() => {
									this.setState({ resultsDisplay: DISPLAY_TYPE.JSON });
									this.interpretJS();
								}}
							>
								&nbsp;
								<FontAwesomeIcon icon="play" /> Execute&nbsp;
							</Button>
							<Button
								variant="secondary"
								onClick={() => this.setState({ configureRunModal: true })}
							>
								<FontAwesomeIcon icon="cog" />{" "}
							</Button>
						</h3>
						{this.state.integrations && this.state.integrations.view
							? this.viewIntegrationModal()
							: ""}
					</div>
					<div className="panel-body">
						{this.state.integrations && this.integrationPanel()}
						{this.state.results === "oauth" ? (
							<h1>Waiting for OAuth</h1>
						) : (
							<div>
								{Object.keys(this.state.results).length > 0 && (
									<Nav variant="tabs">
										<Nav.Item>
											<Nav.Link
												onClick={() =>
													this.setState({
														resultsDisplay: DISPLAY_TYPE.JSON
													})
												}
											>
												JSON Output
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link
												onClick={() =>
													this.setState({
														resultsDisplay: DISPLAY_TYPE.GRAPH
													})
												}
											>
												Graph
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link
												onClick={() =>
													this.setState({
														resultsDisplay: DISPLAY_TYPE.AGGREGATE
													})
												}
											>
												Aggregated
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link
												onClick={() =>
													this.setState({
														resultsDisplay: DISPLAY_TYPE.CODE_SIMILIARITY
													})
												}
											>
												Code Similiarity
											</Nav.Link>
										</Nav.Item>
									</Nav>
								)}
								{this.state.resultsDisplay === DISPLAY_TYPE.JSON &&
									this.jsonResults()}
								{this.state.resultsDisplay === DISPLAY_TYPE.GRAPH &&
									this.graphResults()}
								{this.state.resultsDisplay === DISPLAY_TYPE.AGGREGATE &&
									this.aggregateResults()}
								{this.state.resultsDisplay === DISPLAY_TYPE.CODE_SIMILIARITY &&
									this.codeSimiliarityResults()}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	jsonResults() {
		return (
			<div>
				{this.state.results.connect && (
					<div>
						<h3>Connect</h3>
						{
							<ReactJsonSyntaxHighlighter obj={this.state.results.connect} />
						}{" "}
					</div>
				)}
				{this.state.results.collect && (
					<div className="json-display">
						<h3>Collect</h3>
						{<ReactJsonSyntaxHighlighter obj={this.state.results.collect} />}
					</div>
				)}
				{this.state.results.disconnect && (
					<div>
						<h3>Disconnect</h3>
						{
							<ReactJsonSyntaxHighlighter obj={this.state.results.disconnect} />
						}{" "}
					</div>
				)}
				{this.state.results.config && (
					<div>
						<h3>Config</h3>{" "}
						{<ReactJsonSyntaxHighlighter obj={this.state.results.config} />}
					</div>
				)}
			</div>
		);
	}

	graphResults() {
		console.log(this.state.results.activities);
		return this.state.results.activities &&
			this.state.results.modelledActivities.length > 0 ? (
			<ChartContainer
				timeRange={this.state.results.activities.graphData.timerange()}
				width={1000}
			>
				<ChartRow height="600">
					<YAxis
						id="axis"
						label="Watt Hours"
						width="60"
						max={20000}
						type="linear"
					/>
					<Charts>
						<LineChart
							axis="axis"
							series={this.state.results.activities.graphData}
							columns={["watts"]}
						/>
					</Charts>
				</ChartRow>
			</ChartContainer>
		) : (
			<h3>Activities must be present to render graph</h3>
		);
	}

	aggregateResults() {
		return (
			<div>
				<div className="panel panel-default">
					<div className="panel-header">
						<h1 className="title">Activities</h1>
					</div>
					<div className="panel-body">
						<p>
							Total watt hours: {this.state.results.activities.text.wattHours}
						</p>
						<p>
							Start date: {this.state.results.activities.text.startDate} to end
							date:
							{this.state.results.activities.text.endDate}
						</p>
						<p>
							Watt hours per day:{" "}
							{this.state.results.activities.text.wattsPerDay}
						</p>
					</div>
				</div>
				<div className="panel panel-default">
					<div className="panel-header">
						<h1 className="title">Activities with Carbon model</h1>
					</div>
					<div className="panel-body">
						<p>
							Total carbon emissions:{" "}
							{sumCarbon(this.state.results.modelledActivities)} kg
						</p>
					</div>
				</div>
			</div>
		);

		function sumCarbon(modelledActivites) {
			let carbonInKg = 0;

			modelledActivites.forEach(ma => (carbonInKg += ma));

			return carbonInKg;
		}
	}

	codeSimiliarityResults() {
		return (
			<div>
				<h1>Code Similiarity</h1>
				<label>Connect Similiarity</label>
				<p>
					The integration with the most similiar connect method is &nbsp;
					<b>{this.state.results.codeSimiliarity.connect.name}</b>. Which we
					thought was{" "}
					{getSimiliarityText(
						this.state.results.codeSimiliarity.connect.similiarity
					)}{" "}
					similiar to your code.
				</p>
				<Gauge
					value={100 - this.state.results.codeSimiliarity.connect.similiarity}
					width={200}
					height={120}
					label="Connect Similiarity"
				/>
				<p>{}</p>
				<pre>{this.state.results.codeSimiliarity.connect.body}</pre>
				<label>Collect Similiarity</label>
				<p>
					The integration with the most similiar collect method is &nbsp;
					<b>{this.state.results.codeSimiliarity.collect.name}</b>. Which we
					thought was &nbsp;
					{getSimiliarityText(
						this.state.results.codeSimiliarity.collect.similiarity
					)}
					&nbsp; to your code.
				</p>
				<Gauge
					value={100 - this.state.results.codeSimiliarity.collect.similiarity}
					width={200}
					height={120}
					label="Collect Similiarity"
				/>
				<pre>{this.state.results.codeSimiliarity.collect.body}</pre>
				<label>Disconnect Similiarity</label>
				<p>
					The integration with the most similiar disconnect method is &nbsp;
					<b>{this.state.results.codeSimiliarity.disconnect.name}</b>. Which we
					thought was &nbsp;
					{getSimiliarityText(
						this.state.results.codeSimiliarity.disconnect.similiarity
					)}
					&nbsp; similiar to your code.
				</p>
				<Gauge
					value={
						100 - this.state.results.codeSimiliarity.disconnect.similiarity
					}
					width={200}
					height={120}
					label="Disconnect Similiarity"
				/>
				<pre>{this.state.results.codeSimiliarity.disconnect.body}</pre>
			</div>
		);

		function getSimiliarityText(similiarityValue) {
			console.log(similiarityValue);
			if (similiarityValue === 0) return "identical";
			else if (similiarityValue < 10) return "extremely similiar";
			else if (similiarityValue < 20) return "very similiar";
			else if (similiarityValue < 30) return "similiar";
			else if (similiarityValue < 50) return "somewhat similiar";
			else if (similiarityValue < 70)
				return "quite different, but shares some similariies";
			else if (similiarityValue > 100)
				return "very different shares almost no similiarities";
		}
	}

	configureRunModal() {
		return (
			<Modal animation={false} show={this.state.configureRunModal} size="lg">
				<Modal.Header>
					<Modal.Title>
						<h1>Configure run</h1>
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<h3>Execution Options</h3>
					State to Inject, leave empty to execute as usual.
					<JSONInput
						locale={locale}
						placeholder={this.state.stateInjection}
						height="120px"
						onChange={v => {
							this.temporaryStateInjection = isJson(v.json)
								? JSON.parse(v.json)
								: {};
							this.setStateInjection(this.temporaryStateInjection);
						}}
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						size="lg"
						onClick={() => this.setState({ configureRunModal: false })}
					>
						{" "}
						Close{" "}
					</Button>
				</Modal.Footer>
			</Modal>
		);

		function isJson(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}
	}
}
