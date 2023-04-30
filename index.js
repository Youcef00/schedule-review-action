import core from '@actions/core';
import fetch from 'node-fetch';
import github from '@actions/github';
import { Octokit } from "octokit";

/**
 * Sends asynchronous message into Google Chat
 * @return response
 */
async function sendScheduledMessage() {

    const webhooks = core.getInput('webhooks').split(" ");
    const users = webhooks.map(webhook => {
        const user = webhook.split(/:(.*)/s)[0];
        const webhookURL = webhook.split(/:(.*)/s)[1];
        return {username: user, webhook: webhookURL, pull_requests: []};
    });

    const token = core.getInput('token');

    const octokit = new Octokit({
        auth: token
    });
    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    });

    if (response.status !== 200) {
        throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const pull_requests = response.data;
    pull_requests.forEach(pr => {
        for (let user of users) {
            const reviewers = pr.requested_reviewers.map(reviewer => reviewer.login);
            if (reviewers.includes(user.username)) {
                user.pull_requests.push(pr);
            }
        }
    });

    sendMessage(users);

}

const generateMessage = (user) => {
    return `<p>You have <b><font color="#D14F0A">${user.pull_requests.length}</font></b> pending review requests!</p>
        ${user.pull_requests.map(pr => `<p>🚨 <a href=${pr.html_url}>PR-${pr.number}</a></p>`).join('<br>')}`;
}


/**
 * Sends asynchronous message into Google Chat
 * @return response
 */
function sendMessage(users) {
    users.forEach(user => {
        try {
            let data = {
                "cards": [
                    {
                        "header": {
                            "title": "⚠️️ Pending code reviews reminder  ⚠️"
                        },
                        "sections": [
                            {
                                "widgets": [
                                    {
                                        "textParagraph": {
                                            "text": `${generateMessage(user)}`
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            data = JSON.stringify(data);
            let resp;
            fetch(user.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: data,
            }).then((response) => {
                resp = response;
                console.log(`POST sent, Response: ${response.statusText}`);
            });
        } catch (error) {
            core.setFailed(error.message);
        }
    });



}

sendScheduledMessage();