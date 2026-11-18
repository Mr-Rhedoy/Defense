
require('dotenv').config();

const apiKey = (process.env.GEMINI_API_KEY || '').trim();

const model = (
    process.env.GEMINI_MODEL || 'gemini-3.8-flash'
).trim();

async function testGemini() {

    if (!apiKey) {
        console.error('ERROR: GEMINI_API_KEY is missing in .env');
        process.exitCode = 1;
        return;
    }

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const controller = new AbortController();

    const timer = setTimeout(
        () => controller.abort(),
        60000
    );

    try {

        console.log('Testing Gemini...');
        console.log('Model:', model);

        const response = await fetch(url, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },

            body: JSON.stringify({

                contents: [{
                    role: 'user',
                    parts: [{
                        text: 'Reply briefly in Bengali: Smart-Agro AI সফলভাবে কাজ করছে।'
                    }]
                }],

                generationConfig: {
                    maxOutputTokens: 4096,
                    thinkingConfig: {
                        thinkingLevel: 'low'
                    }
                }

            }),

            signal: controller.signal

        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {

            console.error('Gemini API ERROR:', response.status);

            console.error(
                data.error?.message || 'Unknown Gemini error.'
            );

            process.exitCode = 1;

            return;
        }

        const answer = (data.candidates || [])
            .flatMap(candidate => candidate.content?.parts || [])
            .filter(part => typeof part.text === 'string')
            .map(part => part.text)
            .join('\n')
            .trim();

        if (!answer) {

            console.error('Gemini returned no text.');

            console.error(
                'Finish reason:',
                data.candidates?.[0]?.finishReason || 'unknown'
            );

            process.exitCode = 1;

            return;
        }

        console.log('\nGEMINI CONNECTION SUCCESSFUL!');
        console.log('\nAI ANSWER:\n');
        console.log(answer);

    } catch (error) {

        console.error('\nGEMINI CONNECTION FAILED:');

        console.error(error.name, error.message);

        process.exitCode = 1;

    } finally {

        clearTimeout(timer);

    }
}

testGemini();
