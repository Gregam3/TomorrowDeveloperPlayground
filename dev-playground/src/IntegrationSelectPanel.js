import React, { Component } from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import App from "./App";
import INITIAL_CODE from "./Constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export class IntegrationSelect extends Component {
	constructor(props) {
		super(props);
		this.setCode = props.setCode;
		this.state = {
			integrations: {
				all: props.integrations.all,
				selected: null
			},
			showIntegrationModal: false
		};
	}

	render() {
		return (
			<div style={{ backgroundColor: "#1e1e1e", padding: 10 }}>
				{this.viewIntegrationModal()}
				<div className="col-xs-4">
					<h4>
						<FontAwesomeIcon icon="code-branch" />
						&nbsp;Integrations{" "}
					</h4>
				</div>
				<div className="col-xs-2">
					<Dropdown>
						<Dropdown.Toggle variant="secondary">Load</Dropdown.Toggle>

						<Dropdown.Menu>
							{Object.keys(this.state.integrations.all).map(selected => (
								<Dropdown.Item
									onClick={() =>
										this.setCode(this.state.integrations.all[selected])
									}
								>
									{selected}
								</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="col-xs-2">
					<Dropdown>
						<Dropdown.Toggle variant="secondary">View</Dropdown.Toggle>

						<Dropdown.Menu>
							{Object.keys(this.state.integrations.all).map(i => (
								<Dropdown.Item
									onClick={() => {
										let integrations = this.state.integrations;
										integrations.selected = i;
										this.setState({ integrations, showIntegrationModal: true });
									}}
								>
									{i}
								</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown>
				</div>

				<Button
					variant="secondary"
					onClick={() => {
						console.log(App);
						this.setCode(INITIAL_CODE);
					}}
				>
					Reset
				</Button>
			</div>
		);
	}

	viewIntegrationModal() {
		return (
			<Modal animation={false} show={this.state.showIntegrationModal} size="lg">
				<Modal.Header>
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
					<Button
						variant="secondary"
						onClick={() => this.setState({ showIntegrationModal: false })}
					>
						{" "}
						Close{" "}
					</Button>
				</Modal.Footer>
			</Modal>
		);
	}
}
