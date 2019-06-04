import request from 'superagent';  
	
	//Parameters must be methods
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
};

export {connect,collect,disconnect,config};