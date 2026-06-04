const criteriaList = ['Adaptability', 'Creativity', 'Curiosity', 'Emotional Intelligence', 'Initiative', 'Resilience', 'Integrity', 'Motivation', 'Resolution'];

exports.handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }

        const data = JSON.parse(event.body);
        const aspectWeights = data.aspectWeights || {};
        
        const generatedTraits = {}; 
        let weightedSum = 0;
        let totalWeight = 0;

        // Proses Kalkulasi Tertimbang AI Serverless
        criteriaList.forEach(a => { 
            const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ',''); 
            
            // Generate skor acak antara 65 dan 98 sebagai simulasi hasil analisis NLP
            const scoreRand = Math.floor(Math.random() * (98 - 65 + 1)) + 65; 
            generatedTraits[key] = scoreRand; 
            
            const weight = aspectWeights[key] || 1; 
            weightedSum += (scoreRand * weight); 
            totalWeight += weight; 
        });
        
        const finalScore = Math.round(weightedSum / totalWeight);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                score: finalScore, 
                traits: generatedTraits 
            })
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Gagal menjalankan fungsi AI untuk skor." }) 
        };
    }
};