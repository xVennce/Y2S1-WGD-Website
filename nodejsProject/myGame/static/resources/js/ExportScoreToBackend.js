async function submitScoreToBackend() {
    try {
        const response = await fetch('/compareUserScore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ PLAYERSCORE: totalScore }),
        });
        console.log('Score submitted:', response);
    } catch (err) {
        console.error('Error submitting score:', err);
    }
};
export { submitScoreToBackend };