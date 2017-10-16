import { remote } from "electron";
import React, { Component } from "react";

import "./App.css";

const logo = require("./logo.svg");

export class App extends Component {
  constructor(props: {}) {
    super(props);

    document.addEventListener("keypress", ({ key, shiftKey, ctrlKey }: KeyboardEvent) => {
      if (key === "i" && shiftKey && ctrlKey) {
        remote.getCurrentWindow().webContents.toggleDevTools();
      }
    });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
      </div>
    );
  }
}
