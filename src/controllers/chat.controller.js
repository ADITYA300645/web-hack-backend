import axios from "axios";
import express, { Router } from "express";
const app  = Router();

var currentSessionId = null;

async function createChatSession() {
    try {
        const response = await axios.post(
            "https://api.on-demand.io/chat/v1/sessions",
            {
                pluginIds: [],
                externalUserId: process.env.externalUserId,
            },
            {
                headers: {
                    apikey: process.env.onDemandApiKey,
                },
            }
        );
        return response.data.data.id; // Extract session ID
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
}

async function submitQuery(sessionId, query) {
    try {
        const response = await axios.post(
            "https://api.on-demand.io/chat/v1/sessions/${sessionId}/query",
            {
                endpointId: "predefined-openai-gpt4o",
                query: query,
                pluginIds: ["plugin-1712327325", "plugin-1713962163"],
                responseMode: "sync",
            },
            {
                headers: {
                    apikey: process.env.onDemandApiKey,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error submitting query:", error);
        throw error;
    }
}

function extractJSON(text) {
    const start = text.indexOf('['); 
    const end = text.lastIndexOf(']'); 
    
    if (start !== -1 && end !== -1 && end > start) {
        var jsonString = text.substring(start, end + 1);
        try {
            console.log(jsonString)
            jsonString = JSON.parse(jsonString);
            return jsonString;
        } catch (e) {
            console.error('Invalid JSON string:', e);
            return null;
        }
    }
    return null;
}

app.get("/createChatSession", async (req, res) => {
    try {
        const response = await createChatSession();
        currentSessionId = response;
        res.json({ res: response });
    } catch (err) {
        console.error("error:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/query", async (req, res) => {
    try {

        query =
            req.body.query +
            "return the change in the Given Styled Json Format [{fileName:'someFilename.js',content:'thefullfilecontent',shellScript:'some Commands to run'}] also Generate each files As Given in Query ... Only Provide Json File No Thing ELSE";
        const response = await submitQuery(req.body.sessionId, query);
        // console.log(response.data.answer)
        var json = extractJSON(response.data.answer)
        res.json({res:json});
    } catch (err) {}
});

module.exports = app;