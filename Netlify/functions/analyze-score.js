const criteriaList = ['Adaptability', 'Creativity', 'Curiosity', 'Emotional Intelligence', 'Initiative', 'Resilience', 'Integrity', 'Motivation', 'Resolution'];

exports.handler = async (event) => {
    try {
        const { aspectWeights } = JSON.parse(event.body);
        
        const generatedTraits = {}; 
        let weightedSum = 0;
        let totalWeight = 0;

        // Simulasi analisis AI (Randomizer dengan pembobotan)
        criteriaList.forEach(a => { 
            const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ',''); 
            const scoreRand = Math.floor(Math.random() * (98 - 65 + 1)) + 65; 
            generatedTraits[key] = scoreRand; 
            
            const weight = aspectWeights[key] || 1; 
            weightedSum += (scoreRand * weight); 
            totalWeight += weight; 
        });
        
        const finalScore = Math.round(weightedSum / totalWeight);

        return {
            statusCode: 200,
            body: JSON.stringify({ score: finalScore, traits: generatedTraits })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Gagal menganalisis skor" }) };
    }
};