const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors'); // Importa el middleware cors
const bcrypt = require('bcrypt'); // Importado para las rutas de autores

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10; 

// --- 1. CONFIGURACIÓN DE CONEXIÓN A POSTGRES EN RENDER ---
const pool = new Pool({
    // Usa la URL completa que Render provee como DATABASE_URL
    connectionString: process.env.DATABASE_URL,
    
    // Render requiere SSL si no se usa una red privada. Lo incluimos para evitar fallos.
    ssl: {
        rejectUnauthorized: false
    } 
});

// --- 2. CONFIGURACIÓN DE CORS (AJUSTADO A TU URL DE VERCEL) ---
const allowedOrigins = [
    'https://enlacedo-frontend.vercel.app', // URL de Vercel
    'https://enlacedo.com',                  // Dominio raíz (Namecheap)
    'https://www.enlacedo.com',              // Dominio con www (Namecheap)
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origen (como Postman o peticiones del mismo servidor)
        if (!origin) return callback(null, true); 
        // Verificar si el origen está en la lista blanca
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true 
}));
// -----------------------------------------------------------------

app.use(express.json());


app.get('/', (req, res) => {
  res.send('¡Hola desde el backend con Express y pg!');
});

app.get('/secciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM secciones');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al consultar secciones', err);
    res.status(500).send('Error al obtener las secciones');
  }
});



// Ruta para obtener todas las noticias
app.get('/noticias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM noticias');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener las noticias', err);
    res.status(500).send('Error al obtener las noticias');
  }
});

//turas de autores 
// Rutas para Autores
// POST /autores - Crear un nuevo autor (con registro y hashing de contraseña)

app.post('/autores', async (req, res) => {

    const { nombre, biografia, correo_electronico, password } = req.body;



    if (!password) {

        return res.status(400).send('La contraseña es requerida');

    }



    try {

        // 1. Generar el hash de la contraseña

        const hashedPassword = await bcrypt.hash(password, saltRounds);



        // 2. Insertar el nuevo autor con la contraseña hasheada

        const result = await pool.query(

            'INSERT INTO autores (nombre_autor, biografia_autor, email_autor, password) VALUES ($1, $2, $3, $4) RETURNING *',

            [nombre, biografia, correo_electronico, hashedPassword]

        );

        res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error('Error al crear el autor', err);

        res.status(500).send('Error al crear el autor');

    }

});



// POST /login - Iniciar sesión de un autor

app.post('/login', async (req, res) => {

    const { correo_electronico, password } = req.body;



    if (!correo_electronico || !password) {

        return res.status(400).send('El correo electrónico y la contraseña son requeridos');

    }



    try {

        // 1. Buscar al autor por su correo electrónico

        const result = await pool.query('SELECT * FROM autores WHERE email_autor = $1', [correo_electronico]);

        const autor = result.rows[0];



        if (autor) {

            // 2. Comparar la contraseña proporcionada con la contraseña hasheada almacenada

            const passwordMatch = await bcrypt.compare(password, autor.password);



            if (passwordMatch) {

                // 3. ¡Autenticación exitosa! Aquí deberías generar una sesión o un token (ejemplo básico con un mensaje)

                res.status(200).json({ message: 'Inicio de sesión exitoso', autorId: autor.id_autor, nombre: autor.nombre_autor });

                // En una aplicación real, usarías algo como JWT (JSON Web Tokens) para mantener la sesión.

            } else {

                // Contraseña incorrecta

                res.status(401).send('Credenciales inválidas');

            }

        } else {

            // No se encontró al autor con ese correo electrónico

            res.status(401).send('Credenciales inválidas');

        }

    } catch (err) {

        console.error('Error al iniciar sesión', err);

        res.status(500).send('Error al iniciar sesión');

    }

});



// GET /autores - Obtener todos los autores (sin mostrar la contraseña hash)

app.get('/autores', async (req, res) => {

    try {

        const result = await pool.query('SELECT id_autor, nombre_autor, biografia_autor, email_autor, twitter_autor FROM autores');

        res.json(result.rows);

    } catch (err) {

        console.error('Error al obtener los autores', err);

        res.status(500).send('Error al obtener los autores');

    }

});



// GET /autores/:id - Obtener un autor por su ID (sin mostrar la contraseña hash)

app.get('/autores/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const result = await pool.query('SELECT id_autor, nombre_autor, biografia_autor, email_autor, twitter_autor FROM autores WHERE id_autor = $1', [id]);

        if (result.rows.length > 0) {

            res.json(result.rows[0]);

        } else {

            res.status(404).send('Autor no encontrado');

        }

    } catch (err) {

        console.error(`Error al obtener el autor con ID ${id}`, err);

        res.status(500).send(`Error al obtener el autor con ID ${id}`);

    }

});



// PUT /autores/:id - Actualizar un autor existente (permitiendo actualizar la contraseña)

app.put('/autores/:id', async (req, res) => {

    const { id } = req.params;

    const { nombre, biografia, correo_electronico, password } = req.body;

    const updates = [];

    const values = [];

    let valueIndex = 1;



    if (nombre) {

        updates.push(`nombre_autor = $${valueIndex++}`);

        values.push(nombre);

    }

    if (biografia) {

        updates.push(`biografia_autor = $${valueIndex++}`);

        values.push(biografia);

    }

    if (correo_electronico) {

        updates.push(`email_autor = $${valueIndex++}`);

        values.push(correo_electronico);

    }

    if (password) {

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        updates.push(`password = $${valueIndex++}`);

        values.push(hashedPassword);

    }



    if (updates.length === 0) {

        return res.status(400).send('No se proporcionaron campos para actualizar');

    }



    values.push(id);

    const query = `UPDATE autores SET ${updates.join(', ')} WHERE id_autor = $${valueIndex} RETURNING *`;



    try {

        const result = await pool.query(query, values);

        if (result.rows.length > 0) {

            res.json(result.rows[0]);

        } else {

            res.status(404).send('Autor no encontrado');

        }

    } catch (err) {

        console.error(`Error al actualizar el autor con ID ${id}`, err);

        res.status(500).send(`Error al actualizar el autor con ID ${id}`);

    }

});



// DELETE /autores/:id - Eliminar un autor

app.delete('/autores/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const result = await pool.query('DELETE FROM autores WHERE id_autor = $1 RETURNING *', [id]);

        if (result.rows.length > 0) {

            res.json({ message: `Autor con ID ${id} eliminado exitosamente` });

        } else {

            res.status(404).send('Autor no encontrado');

        }

    } catch (err) {

        console.error(`Error al eliminar el autor con ID ${id}`, err);

        res.status(500).send(`Error al eliminar el autor con ID ${id}`);

    }

});
//rutas de secciones
// Rutas para Secciones

// POST /secciones - Crear una nueva sección
app.post('/secciones', async (req, res) => {
  const { nombre_seccion, slug_seccion } = req.body;
  try {
      const result = await pool.query(
          'INSERT INTO secciones (nombre_seccion, slug_seccion) VALUES ($1, $2) RETURNING *',
          [nombre_seccion, slug_seccion]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error('Error al crear la sección', err);
      res.status(500).send('Error al crear la sección');
  }
});

// GET /secciones - Obtener todas las secciones (ya existente)
// app.get('/secciones', async (req, res) => { ... });
// GET /secciones - Obtener todas las secciones
// GET /secciones - Obtener todas las secciones
app.get('/secciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM secciones');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener las secciones', err);
    res.status(500).send('Error al obtener las secciones');
  }
});
// GET /secciones/:id - Obtener una sección por su ID
app.get('/secciones/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const result = await pool.query('SELECT * FROM secciones WHERE id_seccion = $1', [id]);
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).send('Sección no encontrada');
      }
  } catch (err) {
      console.error(`Error al obtener la sección con ID ${id}`, err);
      res.status(500).send(`Error al obtener la sección con ID ${id}`);
  }
});

// PUT /secciones/:id - Actualizar una sección existente
app.put('/secciones/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_seccion, slug_seccion } = req.body;
  try {
      const result = await pool.query(
          'UPDATE secciones SET nombre_seccion = $1, slug_seccion = $2 WHERE id_seccion = $3 RETURNING *',
          [nombre_seccion, slug_seccion, id]
      );
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).send('Sección no encontrada');
      }
  } catch (err) {
      console.error(`Error al actualizar la sección con ID ${id}`, err);
      res.status(500).send(`Error al actualizar la sección con ID ${id}`);
  }
});

// DELETE /secciones/:id - Eliminar una sección
app.delete('/secciones/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const result = await pool.query('DELETE FROM secciones WHERE id_seccion = $1 RETURNING *', [id]);
      if (result.rows.length > 0) {
          res.json({ message: `Sección con ID ${id} eliminada exitosamente` });
      } else {
          res.status(404).send('Sección no encontrada');
      }
  } catch (err) {
      console.error(`Error al eliminar la sección con ID ${id}`, err);
      res.status(500).send(`Error al eliminar la sección con ID ${id}`);
  }
});

// Rutas para Etiquetas

// POST /etiquetas - Crear una nueva etiqueta
app.post('/etiquetas', async (req, res) => {
  const { nombre_etiqueta, slug_etiqueta } = req.body;
  try {
      const result = await pool.query(
          'INSERT INTO etiquetas (nombre_etiqueta, slug_etiqueta) VALUES ($1, $2) RETURNING *',
          [nombre_etiqueta, slug_etiqueta]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error('Error al crear la etiqueta', err);
      res.status(500).send('Error al crear la etiqueta');
  }
});

// GET /etiquetas - Obtener todas las etiquetas
app.get('/etiquetas', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM etiquetas');
      res.json(result.rows);
  } catch (err) {
      console.error('Error al obtener las etiquetas', err);
      res.status(500).send('Error al obtener las etiquetas');
  }
});

// GET /etiquetas/:id - Obtener una etiqueta por su ID
app.get('/etiquetas/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const result = await pool.query('SELECT * FROM etiquetas WHERE id_etiqueta = $1', [id]);
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).send('Etiqueta no encontrada');
      }
  } catch (err) {
      console.error(`Error al obtener la etiqueta con ID ${id}`, err);
      res.status(500).send(`Error al obtener la etiqueta con ID ${id}`);
  }
});

// PUT /etiquetas/:id - Actualizar una etiqueta existente
app.put('/etiquetas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_etiqueta, slug_etiqueta } = req.body;
  try {
      const result = await pool.query(
          'UPDATE etiquetas SET nombre_etiqueta = $1, slug_etiqueta = $2 WHERE id_etiqueta = $3 RETURNING *',
          [nombre_etiqueta, slug_etiqueta, id]
      );
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).send('Etiqueta no encontrada');
      }
  } catch (err) {
      console.error(`Error al actualizar la etiqueta con ID ${id}`, err);
      res.status(500).send(`Error al actualizar la etiqueta con ID ${id}`);
  }
});

// DELETE /etiquetas/:id - Eliminar una etiqueta
app.delete('/etiquetas/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const result = await pool.query('DELETE FROM etiquetas WHERE id_etiqueta = $1 RETURNING *', [id]);
      if (result.rows.length > 0) {
          res.json({ message: `Etiqueta con ID ${id} eliminada exitosamente` });
      } else {
          res.status(404).send('Etiqueta no encontrada');
      }
  } catch (err) {
      console.error(`Error al eliminar la etiqueta con ID ${id}`, err);
      res.status(500).send(`Error al eliminar la etiqueta con ID ${id}`);
  }
});

// Rutas para la relación entre Noticias y Etiquetas

// POST /noticias/:id_noticia/etiquetas/:id_etiqueta - Asociar una etiqueta a una noticia
app.post('/noticias/:id_noticia/etiquetas/:id_etiqueta', async (req, res) => {
  const { id_noticia, id_etiqueta } = req.params;
  try {
      // Primero, verifica si la noticia y la etiqueta existen
      const noticiaResult = await pool.query('SELECT * FROM noticias WHERE id_noticia = $1', [id_noticia]);
      const etiquetaResult = await pool.query('SELECT * FROM etiquetas WHERE id_etiqueta = $1', [id_etiqueta]);

      if (noticiaResult.rows.length === 0 || etiquetaResult.rows.length === 0) {
          return res.status(404).send('Noticia o etiqueta no encontrada');
      }

      // Si existen, crea la relación
      const result = await pool.query(
          'INSERT INTO noticias_etiquetas (id_noticia, id_etiqueta) VALUES ($1, $2) RETURNING *',
          [id_noticia, id_etiqueta]
      );
      res.status(201).json({ message: `Etiqueta ${id_etiqueta} asociada a la noticia ${id_noticia} exitosamente` });
  } catch (err) {
      console.error(`Error al asociar la etiqueta ${id_etiqueta} a la noticia ${id_noticia}`, err);
      res.status(500).send(`Error al asociar la etiqueta ${id_etiqueta} a la noticia ${id_noticia}`);
  }
});

// DELETE /noticias/:id_noticia/etiquetas/:id_etiqueta - Desasociar una etiqueta de una noticia
app.delete('/noticias/:id_noticia/etiquetas/:id_etiqueta', async (req, res) => {
  const { id_noticia, id_etiqueta } = req.params;
  try {
      const result = await pool.query(
          'DELETE FROM noticias_etiquetas WHERE id_noticia = $1 AND id_etiqueta = $2 RETURNING *',
          [id_noticia, id_etiqueta]
      );
      if (result.rowCount > 0) {
          res.json({ message: `Etiqueta ${id_etiqueta} desasociada de la noticia ${id_noticia} exitosamente` });
      } else {
          res.status(404).send('Asociación no encontrada');
      }
  } catch (err) {
      console.error(`Error al desasociar la etiqueta ${id_etiqueta} de la noticia ${id_noticia}`, err);
      res.status(500).send(`Error al desasociar la etiqueta ${id_etiqueta} de la noticia ${id_noticia}`);
  }
});

// Ruta para la relación entre Noticias e Imágenes (asumiendo URLs de imágenes)

// POST /noticias/:id_noticia/imagenes - Asociar una URL de imagen a una noticia
app.post('/noticias/:id_noticia/imagenes', async (req, res) => {
  const { id_noticia } = req.params;
  const { url_imagen, es_principal } = req.body; // es_principal podría indicar si es la imagen principal de la noticia

  try {
      // Primero, verifica si la noticia existe
      const noticiaResult = await pool.query('SELECT * FROM noticias WHERE id_noticia = $1', [id_noticia]);

      if (noticiaResult.rows.length === 0) {
          return res.status(404).send('Noticia no encontrada');
      }

      // Crea la asociación con la URL de la imagen
      const result = await pool.query(
          'INSERT INTO noticias_imagenes (id_noticia, url_imagen, es_principal) VALUES ($1, $2, $3) RETURNING *',
          [id_noticia, url_imagen, es_principal || false] // Si es_principal no se proporciona, se establece en false por defecto
      );
      res.status(201).json({ message: `Imagen asociada a la noticia ${id_noticia} exitosamente`, imagen: result.rows[0] });
  } catch (err) {
      console.error(`Error al asociar la imagen a la noticia ${id_noticia}`, err);
      res.status(500).send(`Error al asociar la imagen a la noticia ${id_noticia}`);
  }
});

// GET /noticias/:id_noticia/imagenes - Obtener todas las imágenes asociadas a una noticia
app.get('/noticias/:id_noticia/imagenes', async (req, res) => {
  const { id_noticia } = req.params;
  try {
      const result = await pool.query('SELECT url_imagen, es_principal FROM noticias_imagenes WHERE id_noticia = $1', [id_noticia]);
      res.json(result.rows);
  } catch (err) {
      console.error(`Error al obtener las imágenes de la noticia ${id_noticia}`, err);
      res.status(500).send(`Error al obtener las imágenes de la noticia ${id_noticia}`);
  }
});

// DELETE /noticias/:id_noticia/imagenes/:url_imagen - Desasociar una imagen de una noticia (usando la URL como identificador)
app.delete('/noticias/:id_noticia/imagenes/:url_imagen', async (req, res) => {
  const { id_noticia, url_imagen } = req.params;
  try {
      const result = await pool.query('DELETE FROM noticias_imagenes WHERE id_noticia = $1 AND url_imagen = $2 RETURNING *', [id_noticia, url_imagen]);
      if (result.rowCount > 0) {
          res.json({ message: `Imagen con URL ${url_imagen} desasociada de la noticia ${id_noticia} exitosamente` });
      } else {
          res.status(404).send('Asociación de imagen no encontrada');
      }
  } catch (err) {
      console.error(`Error al desasociar la imagen de la noticia ${id_noticia}`, err);
      res.status(500).send(`Error al desasociar la imagen de la noticia ${id_noticia}`);
  }
});

// Ruta para obtener todas las noticias de una sección específica (usando slug)
app.get('/secciones/:slug_seccion/noticias', async (req, res) => {
  const { slug_seccion } = req.params;
  try {
      // Primero, obtenemos el ID de la sección usando el slug
      const seccionResult = await pool.query('SELECT id_seccion FROM secciones WHERE slug_seccion = $1', [slug_seccion]);

      if (seccionResult.rows.length === 0) {
          return res.status(404).send('Sección no encontrada');
      }

      const id_seccion = seccionResult.rows[0].id_seccion;

      // Luego, obtenemos todas las noticias que pertenecen a esa sección
      const noticiasResult = await pool.query('SELECT * FROM noticias WHERE id_seccion = $1', [id_seccion]);
      res.json(noticiasResult.rows);

  } catch (err) {
      console.error(`Error al obtener las noticias de la sección con slug ${slug_seccion}`, err);
      res.status(500).send(`Error al obtener las noticias de la sección con slug ${slug_seccion}`);
  }
});

// Ruta para obtener todas las noticias de una etiqueta específica (usando slug)
app.get('/etiquetas/:slug_etiqueta/noticias', async (req, res) => {
  const { slug_etiqueta } = req.params;
  try {
      // Primero, obtenemos el ID de la etiqueta usando el slug
      const etiquetaResult = await pool.query('SELECT id_etiqueta FROM etiquetas WHERE slug_etiqueta = $1', [slug_etiqueta]);

      if (etiquetaResult.rows.length === 0) {
          return res.status(404).send('Etiqueta no encontrada');
      }

      const id_etiqueta = etiquetaResult.rows[0].id_etiqueta;

      // Luego, obtenemos todas las noticias que están asociadas a esa etiqueta a través de la tabla noticias_etiquetas
      const noticiasResult = await pool.query(`
          SELECT n.*
          FROM noticias n
          INNER JOIN noticias_etiquetas ne ON n.id_noticia = ne.id_noticia
          WHERE ne.id_etiqueta = $1
      `, [id_etiqueta]);

      res.json(noticiasResult.rows);

  } catch (err) {
      console.error(`Error al obtener las noticias de la etiqueta con slug ${slug_etiqueta}`, err);
      res.status(500).send(`Error al obtener las noticias de la etiqueta con slug ${slug_etiqueta}`);
  }
});

// Ruta para obtener una noticia por su ID
app.get('/noticias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM noticias WHERE id_noticia = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Noticia no encontrada');
    }
  } catch (err) {
    console.error(`Error al obtener la noticia con ID ${id}`, err);
    res.status(500).send(`Error al obtener la noticia con ID ${id}`);
  }
});

app.put('/noticias/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, subtitulo, contenido, id_seccion, id_autor, fuente_original, url_fuente, palabras_clave, es_destacada, estado } = req.body;

  try {
    const result = await pool.query(
      'UPDATE noticias SET titulo = $1, subtitulo = $2, contenido = $3, id_seccion = $4, id_autor = $5, fuente_original = $6, url_fuente = $7, palabras_clave = $8, es_destacada = $9, estado = $10, fecha_actualizacion = NOW() WHERE id_noticia = $11 RETURNING *',
      [titulo, subtitulo, contenido, id_seccion, id_autor, fuente_original, url_fuente, palabras_clave, es_destacada, estado, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Noticia no encontrada');
    }
  } catch (err) {
    console.error(`Error al actualizar la noticia con ID ${id}`, err);
    res.status(500).send(`Error al actualizar la noticia con ID ${id}`);
  }
});

app.delete('/noticias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM noticias WHERE id_noticia = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: `Noticia con ID ${id} eliminada exitosamente` });
    } else {
      res.status(404).send('Noticia no encontrada');
    }
  } catch (err) {
    console.error(`Error al eliminar la noticia con ID ${id}`, err);
    res.status(500).send(`Error al eliminar la noticia con ID ${id}`);
  }
});

app.post('/noticias', async (req, res) => {
  const { titulo, subtitulo, contenido, id_seccion, id_autor, fuente_original, url_fuente, palabras_clave, es_destacada, estado } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO noticias (titulo, subtitulo, contenido, id_seccion, id_autor, fuente_original, url_fuente, palabras_clave, es_destacada, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [titulo, subtitulo, contenido, id_seccion, id_autor, fuente_original, url_fuente, palabras_clave, es_destacada, estado]
    );
    res.status(201).json(result.rows[0]); // Respondemos con la noticia creada
  } catch (err) {
    console.error('Error al crear la noticia', err);
    res.status(500).send('Error al crear la noticia');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});