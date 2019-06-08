import React, {Component} from "react";
import {Button, Modal} from "react-bootstrap";

export class Documentation extends Component {

	state = {
		showTypesModal: false
	};

	render() {
		return <div className="panel panel-default documentation">
			<div className="panel-header"><h1 className="title">Using the Playground</h1></div>
			<div className="panel-body">
				<h3>Basics</h3>
				<p>Either paste or write your code in the above editor, your code must implement the
					methods <code>connect</code>, <code>collect</code> and <code>disconnect</code> (note
					that the <code>state</code> passed into collect is the outcome of the connect method.
					Additionally you will need to implement an object called <code>config</code>.
					If you do not see these already hit the Reset button.
					When you're ready hit the run button and wait for results to come back. It it recommended you
					browse some currently working integrations (using the drop down) before writing your own.</p>
				<h3>Importing Externally</h3>
				<p>We have a number of libraries pre-installed and you can import them
					as normal. Some of these libraries include: <code>superagent</code>,
					<code>node-fetch</code> and <code>flatten</code>. Please let us know if
					you require additional libraries and we'll look into adding them if the demand
					is high enough.</p>
				<h3>Importing from the Project</h3>
				<p>In order to import type enums for configs please use the following code
					<code>`import {'{CHOSEN_TYPE}'} from '../../../tmrowapp-contrib/definitions';`</code> a list of
					types can be found <Button variant="secondary" onClick={() => this.setState({showTypesModal: true})}>here</Button></p>
				<p>In order to import environment variables you've added on the Environment variable panel
					use <code> import env from './env'</code> and access items with <code>env.key</code></p>
				<h3>OAuth</h3>
				<p>In order to use OAuth you must use the following code <code>import {'{OAuthManager}'}
					from '../../../tmrowapp-contrib/integrations/utils/oauth';</code> and initialise appropriately.</p>
			</div>
			{this.viewTypesModal()}
		</div>
	}

	viewTypesModal() {
		return <Modal animation={false} show={this.state.showTypesModal} size="lg">
			<Modal.Header closeButton>
				<Modal.Title><h1>Type Definitions</h1></Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<pre style={{fontSize: 30}}>
				<code>
					ACTIVITY_TYPE_ELECTRICITY,
					ACTIVITY_TYPE_ELECTRIC_VEHICLE_CHARGING,
					ACTIVITY_TYPE_TRANSPORTATION,
					ACTIVITY_TYPE_MEAL,
					TRANSPORTATION_MODE_PLANE,
					TRANSPORTATION_MODE_CAR,
					TRANSPORTATION_MODE_BUS,
					TRANSPORTATION_MODE_PUBLIC_TRANSPORT,
					TRANSPORTATION_MODE_TRAIN,
					TRANSPORTATION_MODE_FERRY
				</code>
				</pre>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={() => this.setState({showTypesModal : false})}> Close </Button>
			</Modal.Footer>
		</Modal>
	}
}
