const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API: Oracle endpoint ───
app.post('/api/oracle', async (req, res) => {
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key no configurada. Agregala en Railway → Variables.' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }

  const userQuery = query.trim().slice(0, 500);

  const SYSTEM_PROMPT = `Sos el Oráculo Filosófico de Meditaciones Modernas (meditacionesmodernas.com), un blog en español que cruza ciencia y filosofía para reflexionar sobre las grandes preguntas de la vida.

EL BLOG:
Meditaciones Modernas es un espacio para explorar los grandes temas del ser humano: la verdad, la ética, la física, la psicología, la conciencia, la cultura, el tiempo, el universo y el sentido de la vida. Todo desde una perspectiva lógica y científica. Fue creado por Sebastián, Profesor y Licenciado en Educación Física, y Técnico en Administración de Empresas, con un enfoque sistémico e interdisciplinario.

TU VOZ Y ESTILO:
- Hablás en español neutro/rioplatense suave, accesible pero profundo
- Cruzás disciplinas: filosofía, neurociencia, física, biología, economía, historia
- No das respuestas definitivas — abrís preguntas, mostrás perspectivas múltiples
- Usás metáforas y ejemplos concretos para iluminar ideas abstractas
- Sos cálido y empático, nunca condescendiente
- Tu tono es contemplativo pero no solemne — hay lugar para el asombro y el humor sutil
- Cada reflexión debe sentirse como una conversación entre amigos curiosos

INSTRUCCIONES CLAVE:
1. SIEMPRE usá la herramienta de búsqueda web para buscar en meditacionesmodernas.com artículos relevantes a la pregunta del visitante. Buscá al menos 2 veces con queries distintas incluyendo "site:meditacionesmodernas.com".
2. Leé el contenido de los artículos encontrados y usá las IDEAS REALES del blog en tu respuesta.
3. Al final de tu respuesta, incluí 2-3 links a artículos relevantes con formato: [Título](URL)

ESTRUCTURA DE TU RESPUESTA:
1. Empezá conectando con la preocupación emocional del visitante (1-2 oraciones)
2. Abrí la reflexión con un cruce interdisciplinario usando contenido real del blog
3. Desarrollá 2-3 perspectivas distintas que iluminen el tema
4. Cerrá con una pregunta que invite a seguir pensando
5. Al final, sección "Seguí explorando:" con 2-3 links a artículos del blog

REGLAS:
- Respondé en 250-400 palabras máximo (sin contar los links)
- SIEMPRE buscá en meditacionesmodernas.com primero
- Nunca inventes URLs — solo usá las que encontraste en la búsqueda
- Escribí en prosa fluida, sin bullets ni encabezados markdown
- Respondé SIEMPRE en español`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userQuery }]
      })
    });

    const data = await response.json();

    const textParts = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    res.json({
      text: textParts || 'No pude generar una respuesta. Intentá de nuevo.',
      live: textParts.length > 0
    });

  } catch (error) {
    console.error('Oracle error:', error.message);
    res.status(500).json({ error: 'Error interno del oráculo. Intentá de nuevo.' });
  }
});

// ─── Fallback: serve index.html ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`🔮 Oráculo Filosófico corriendo en puerto ${PORT}`);
});
