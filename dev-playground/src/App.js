import React, {Component} from 'react';
import './App.css';
import MonacoEditor from 'react-monaco-editor';
import {Button, Dropdown, Nav} from 'react-bootstrap';
import ReactJsonSyntaxHighlighter from 'react-json-syntax-highlighter'
import Form from "react-bootstrap/Form";
import {evaluateCode} from "./RequestManager";
import {Modal} from "react-bootstrap";
import Cookies from 'universal-cookie';
import {processActivities} from "./ActivityProcessor";
import io from "socket.io-client";
import {Charts, ChartContainer, ChartRow, YAxis, LineChart} from "react-timeseries-charts";
import {TimeSeries, TimeRange} from "pondjs";
import uuidv1 from 'uuid/v1';
import {Documentation} from "./Documentation";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

const editorOptions = {
	selectOnLineNumbers: true,
	autoIndent: true,
	colorDecorators: true,
	copyWithSyntaxHighlighting: true,
	fontSize: 18
};

const cookies = new Cookies();

const id = cookies.get('id') !== undefined ? cookies.get('id') : uuidv1();

const initialCode =
	`//Parameters must be methods
async function connect(requestLogin, requestWebView) {
  const { username, password } = await requestLogin();

  return {
    username,
    password,
  };
}

//Clear state after completion
function disconnect() {
  return {};
}

//Using State retrieved from login fetch data 
async function collect(state, { logWarning }) {
  return { activities: [], state };
}

//Configure how your integration is displayed
const config = {
  label: '',
  description: '',
  country: '', //i.e. UK, DK 
  isPrivate: true,
  type: null,
};`;

const AUTH_TYPE = {
	WEB_AUTH: 0,
	MANUAL_AUTH: 1
};

const DISPLAY_TYPE = {
	JSON: 0,
	GRAPH: 1,
	AGGREGATE: 2
};

const nodePort = 3001;

class App extends Component {
	state = {
		functions: null,
		results: {},
		code: null,
		envRefList: [],
		authType: AUTH_TYPE.MANUAL_AUTH,
		authChoice: {
			webviewRadio: React.createRef(),
			manualRadio: React.createRef()
		},
		resultsDisplay: DISPLAY_TYPE.JSON,
		injectState: ""
	};

	authRefs = {
		username: React.createRef(),
		password: React.createRef(),
		url: React.createRef(),
	};

	executionRef = React.createRef();

	constructor(props) {
		super(props);
		if (cookies.get('id') === undefined) cookies.set('id', id);

		const socket = io('http://' + window.location.hostname + ':' + nodePort, {query: 'name=' + id});
		socket.on('setIntegrations',
			(integrations) => this.setState({
				integrations: {
					all: integrations,
					selected: null
				}
			}));
		socket.on('openUrl',
			(url) => window.open(url));
		socket.on('setResults',
			(results) => {
				toast.success('Results Updated', {autoClose: 2000});
				results.activities = processActivities(results.collect.activities);
				this.setState({results});
			});
		socket.on('setCode',
			(code) => this.setState({code: code !== null ? code : initialCode}));
		socket.on('evaluation-error',
			(error) => {
				console.log(error, 'test');
				toast.error(Object.keys(error).length > 0 ? JSON.stringify(error) :
					'An Error occurred, but no error message could be retrieved')
			});
	}

	render() {
		return (
			<div>
				<div>
					<img style={{
						marginTop: '10px',
						flex: 1
					}} src="tmrow-light.png"/>
					<h1 style={{float: 'right', marginRight: '70%'}}>
						Developer Playground </h1>
				</div>
				{this.authForm()}
				{this.testResults()}
				{this.state.integrations && this.state.integrations.view ? this.viewIntegrationModal() : ""}
				{this.state.previousRuns ? this.codeHistoryDropdown() : ""}
				{this.environmentPanel()}
				{this.configureRunModal()}
				<Documentation/>
				<ToastContainer style={{width: '40%', fontSize: '25pt'}}/>

				{this.state.code === null ? <h1>Fetching Code</h1> :
					<MonacoEditor
						height="850"
						width="1300"
						language="javascript"
						theme="vs-light"
						value={this.state.code}
						options={editorOptions}
						onChange={v => this.setState({code: v})}
					/>}
			</div>
		);
	}

	interpretJS() {
		this.setState({results: {}});
		let previousRuns = cookies.get('previous-runs');

		if (cookies.get('code') !== undefined) {
			if (previousRuns === undefined) previousRuns = {};

			previousRuns['Run at: ' + new Date().toLocaleString()] = this.state.code;
			this.setState({previousRuns});
		}

		let authDetails = {authType: this.state.authType};

		if (this.state.authType === AUTH_TYPE.MANUAL_AUTH) {
			cookies.set('username', this.authRefs.username.current.value);
			cookies.set('password', this.authRefs.password.current.value);
			authDetails.username = this.authRefs.username.current.value;
			authDetails.password = this.authRefs.password.current.value;
		}

		evaluateCode(this.state.code, authDetails, getEnvAsObject(this.state.envRefList), 
				id, this.state.injectState);

		function getEnvAsObject(refs) {
			let obj = {};
			refs.forEach(r => obj[r.key.current.value] = r.value.current.value);
			return obj;
		}
	}

	configureRunModal() {
		return <Modal animation={false} show={this.state.configureRunModal} size="lg">
			<Modal.Header closeButton>
				<Modal.Title><h1>Configure run</h1></Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<h3>Execution Options</h3>
				State to Inject, leave empty to execute as usual.
				<JSONInput
					locale={locale}
					placeholder={{oauthKey: "EXAMPLEKEY"}}
					height='120px'
					onChange={(v) => {
						console.log(v.json)
						this.setState({injectState: JSON.parse(v.json)})
						}}
				/>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={() => this.setState({configureRunModal: false})}> Close </Button>
			</Modal.Footer>
		</Modal>
	}

	//TODO move to component
	testResults() {
		return <div className="test-results panel panel-default">
			<div className="panel-header" style={{marginLeft: '10px'}}>
				<h1>Test Results <Button variant="secondary" style={{fontSize: '26px'}}
				                         onClick={() => this.interpretJS()}> Run </Button>
					<Button variant="secondary" style={{fontSize: '26px'}}
					        onClick={() => this.setState({configureRunModal: true})}> Cog </Button></h1>
			</div>
			<div className="panel-body">
				{this.state.integrations ? this.integrationPanel() : ""}
				{this.state.results === "oauth" ? <h1>Waiting for OAuth</h1> :
					<div>
						<Nav variant="tabs">
							<Nav.Item>
								<Nav.Link onClick={() => this.setState({resultsDisplay: DISPLAY_TYPE.JSON})}>
									JSON Output</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link onClick={() => this.setState({resultsDisplay: DISPLAY_TYPE.GRAPH})}>
									Graph</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link onClick={() => this.setState({resultsDisplay: DISPLAY_TYPE.AGGREGATE})}>
									Aggregated</Nav.Link>
							</Nav.Item>
						</Nav>
						{this.state.resultsDisplay === DISPLAY_TYPE.JSON ? this.jsonResults() : ""}
						{this.state.resultsDisplay === DISPLAY_TYPE.GRAPH ? this.graphResults() : ""}
						{this.state.resultsDisplay === DISPLAY_TYPE.AGGREGATE ? this.aggregateResults() : ""}
					</div>
				}
			</div>
		</div>
	}

	jsonResults() {
		return <div>
			{this.state.results.connect ? <div><h3>Connect</h3>
				{<ReactJsonSyntaxHighlighter obj={this.state.results.connect}/>} </div> : ""}
			{this.state.results.collect ? <div className="json-display"><h3>Collect</h3>
				{<ReactJsonSyntaxHighlighter obj={this.state.results.collect}/>}</div> : ""}
			{this.state.results.disconnect ? <div><h3>Disconnect</h3>
				{<ReactJsonSyntaxHighlighter obj={this.state.results.disconnect}/>} </div> : ""}
			{this.state.results.config ?
				<div><h3>Config</h3> {<ReactJsonSyntaxHighlighter obj={this.state.results.config}/>}
				</div> : ""}
		</div>;
	}

	graphResults() {
		return <ChartContainer timeRange={this.state.results.activities.graphData.timerange()} width={1000}>
			<ChartRow height="600">
				<YAxis id="axis" label="Watt Hours" width="60" max={20000} type="linear"/>
				<Charts>
					<LineChart axis="axis" series={this.state.results.activities.graphData} columns={["watts"]}/>
				</Charts>
			</ChartRow>
		</ChartContainer>
	}

	//TODO move to component
	authForm() {
		return <div className="auth-input panel panel-default">
			<div className="panel-header">
				<h1 style={{marginLeft: '10px'}}>Auth Input </h1>
			</div>
			<hr/>
			<div className="panel-body">
				{this.state.authType === AUTH_TYPE.MANUAL_AUTH ?
					<Form>
						<Form.Group>
							<Form.Label>Username</Form.Label>
							<Form.Control placeholder="Username" ref={this.authRefs.username}/>
						</Form.Group>

						<Form.Group>
							<Form.Label>Password</Form.Label>
							<Form.Control type="password" placeholder="Password" ref={this.authRefs.password}/>
						</Form.Group>
					</Form> : ""}
				{this.state.authType === AUTH_TYPE.WEB_AUTH ?
					<Form>
						<Form.Group>
							<Form.Label>Auth URL</Form.Label>
							<Form.Control placeholder="www.google.com/oauth" ref={this.authRefs.url}/>
						</Form.Group>
					</Form> : ""}
			</div>
		</div>
	}

	//TODO move to component
	integrationPanel() {
		return <div>
			Currently selected: {this.state.integrations.selected}
			<Dropdown>
				<Dropdown.Toggle variant="secondary" size="lg">Integrations</Dropdown.Toggle>

				<Dropdown.Menu>
					{Object.keys(this.state.integrations.all).map(i => <Dropdown.Item
						onClick={() => {
							let integrations = this.state.integrations;
							integrations.selected = i;
							this.setState({integrations})
						}}>{i}</Dropdown.Item>)}
				</Dropdown.Menu>
			</Dropdown>
			<Button variant="secondary" size="lg"
			        onClick={() =>
				        this.setState({code: this.state.integrations.all[this.state.integrations.selected]})}>
				Load </Button>
			<Button variant="secondary" size="lg"
			        onClick={() => {
				        let integrations = this.state.integrations;
				        integrations.view = this.state.integrations.all[this.state.integrations.selected];
				        this.setState({integrations})
			        }}> View </Button>
			<Button variant="secondary" size="lg"
			        onClick={() => this.setState({code: initialCode})}>Reset </Button>
		</div>
	}

	viewIntegrationModal() {
		return (<Modal animation={false} show={true} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Code for {this.state.integrations.selected}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<pre>
				<code>
				{this.state.integrations.all[this.state.integrations.selected]}
				</code>
				</pre>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={() => {
					let integrations = this.state.integrations;
					integrations.view = null;
					this.setState({integrations})
				}}> Close </Button>
			</Modal.Footer>
		</Modal>)
	}

	environmentPanel() {
		return <div className="panel panel-default env-input" style={{overflowY: 'scroll'}}>
			<div className="panel-header">
				<h1 className="title">Environment Variables &nbsp;
					<Button onClick={() => this.addEnvInput()} size="lg" variant="secondary">Add</Button></h1>
			</div>
			<div className="panel-body">
				{this.state.envRefList.map(e => <Form>
					<Form.Group className="col-xs-6">
						<Form.Control placeholder="Key" ref={e.key}/>
					</Form.Group>

					<Form.Group className="col-xs-6">
						<Form.Control placeholder="Value" ref={e.value}/>
					</Form.Group>
				</Form>)}
			</div>
		</div>
	}

	addEnvInput() {
		let envRefList = this.state.envRefList;
		envRefList.push({
			key: React.createRef(),
			value: React.createRef()
		});
		this.setState({envRefList});
	}

	aggregateResults() {
		return <div className="panel panel-default">
			<div className="panel-header"><h1 className="title">Activities</h1></div>
			<div className="panel-body">
				<p>Total watt hours: {this.state.results.activities.text.wattHours}</p>
				<p>Start date: {this.state.results.activities.text.startDate} to end date:
					{this.state.results.activities.text.endDate}</p>
				<p>Watt hours per day: {this.state.results.activities.text.wattsPerDay}</p>
			</div>
		</div>
	}
}

export default App;
