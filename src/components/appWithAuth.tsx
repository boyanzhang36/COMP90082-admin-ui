
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import ConfigService from '../services/config.service';
import { IConfig, IConfigPage } from '../common/models/config.model';
import { Page } from '../components/page/page.comp';
import { Navigation } from '../components/navigation/navigation.comp';
import { AppContext } from './app.context';
import HttpService from '../services/http.service';
import { CustomStyles } from './customStyles/customStyles.comp';
import App from './app';

import './app.scss';
import 'react-toastify/dist/ReactToastify.css';

import { AmplifyAuthenticator, AmplifySignOut, AmplifySignUp, AmplifySignIn } from '@aws-amplify/ui-react';
import Amplify from "aws-amplify";

// Configure dotenv for Setup Environment Variables:
require('dotenv').config();

// Re-use an existing authentication resource from AWS
Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_APP_CLIENT_ID
  }
});

const httpService = new HttpService();
const defaultAppName: string = 'RESTool App';

function changeFavicon(src: string) {
  const link = document.createElement('link');
  const oldLink = document.getElementById('favicon');
  link.id = 'favicon';
  link.rel = 'shortcut icon';
  link.href = src;
  if (oldLink) {
    document.head.removeChild(oldLink);
  }
  document.head.appendChild(link);
}

// Components
function AppWithAuth() {
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [config, setConfig] = useState<IConfig | null>(null);
  const [activePage, setActivePage] = useState<IConfigPage | null>(config?.pages?.[0] || null);
  const [error, setError] = useState<string | null>(null);
  const appName: string = config?.name || defaultAppName;
  
  async function loadConfig(url?: string): Promise<void> {
    try {
      const windowConfig = (window as any).RESTool?.config;
      let remoteConfig: IConfig; 
      // Try to load config from window object first
      if (!url && windowConfig) {
        remoteConfig = Object.assign({}, windowConfig, {});
      } else {
        remoteConfig = url ? await ConfigService.getRemoteConfig(url) : await ConfigService.loadDefaultConfig();
      }
      
      // Setting global config for httpService
      httpService.baseUrl = process.env.REACT_APP_BASEURL || '';  // Read from .env
      // httpService.baseUrl = remoteConfig.baseUrl || '';
      
      httpService.errorMessageDataPath = remoteConfig.errorMessageDataPath || '';
      httpService.unauthorizedRedirectUrl = remoteConfig.unauthorizedRedirectUrl || '';
      httpService.requestHeaders = remoteConfig.requestHeaders || {};
      document.title = remoteConfig.name || defaultAppName;
      
      if (remoteConfig?.favicon) {
        changeFavicon(remoteConfig.favicon);
      }
      
      if (remoteConfig?.remoteUrl) {
        return await loadConfig(remoteConfig.remoteUrl);
      }
      
      setConfig(remoteConfig);
    } catch (e) {
      console.error('Could not load config file', e);
    }
    
    setFirstLoad(false);
  }
  
  function scrollToTop(scrollDuration: number = 250) {
    var cosParameter = window.scrollY / 2,
    scrollCount = 0,
    oldTimestamp = performance.now();
    
    function step (newTimestamp: number) {
      scrollCount += Math.PI / (scrollDuration / (newTimestamp - oldTimestamp));
      
      if (scrollCount >= Math.PI) {
        window.scrollTo(0, 0);
      }
      
      if (window.scrollY === 0) {
        return;
      }
      
      window.scrollTo(0, Math.round(cosParameter + cosParameter * Math.cos(scrollCount)));
      oldTimestamp = newTimestamp;
      window.requestAnimationFrame(step);
    }
    
    window.requestAnimationFrame(step);
  }
  
  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const { isValid, errorMessage } = ConfigService.validateConfig(config);
    
    if (!isValid) {
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
  }, [config]);
  
  return (
    <AmplifyAuthenticator usernameAlias="email" data-testid="amplify-auth">
      {/* <AmplifySignUp
        data-testid="sign-up"
        slot="sign-up"
        usernameAlias="email"
        
        formFields={[
          {
            type: "email",
            label: "Email Address",
            placeholder: "Enter your email address",
            required: true,
          },
          {
            type: "password",
            label: "Password",
            placeholder: "Enter your password",
            required: true,
          },
          {
            type: "phone_number",
            label: "Phone number",
            placeholder: "Enter your phone number",
            required: false,
          }
        ]} 
      /> */}
      <AmplifySignIn slot="sign-in" hideSignUp usernameAlias="email" data-testid="sign-in"/>
        <App /> 
    </AmplifyAuthenticator>
    );
  }
  
  export default AppWithAuth;
  