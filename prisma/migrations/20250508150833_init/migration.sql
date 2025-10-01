-- CreateTable
CREATE TABLE "noticias" (
    "id_noticia" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "subtitulo" TEXT,
    "contenido" TEXT NOT NULL,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3),
    "id_seccion" INTEGER NOT NULL,
    "id_autor" INTEGER,
    "fuente_original" VARCHAR(255),
    "url_fuente" VARCHAR(255),
    "palabras_clave" TEXT,
    "es_destacada" BOOLEAN NOT NULL DEFAULT false,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'publicado',

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id_noticia")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id_seccion" SERIAL NOT NULL,
    "nombre_seccion" VARCHAR(100) NOT NULL,
    "descripcion_seccion" TEXT,
    "slug_seccion" VARCHAR(100) NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id_seccion")
);

-- CreateTable
CREATE TABLE "autores" (
    "id_autor" SERIAL NOT NULL,
    "nombre_autor" VARCHAR(150) NOT NULL,
    "biografia_autor" TEXT,
    "email_autor" VARCHAR(100),
    "twitter_autor" VARCHAR(100),

    CONSTRAINT "autores_pkey" PRIMARY KEY ("id_autor")
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id_etiqueta" SERIAL NOT NULL,
    "nombre_etiqueta" VARCHAR(100) NOT NULL,
    "slug_etiqueta" VARCHAR(100) NOT NULL,

    CONSTRAINT "etiquetas_pkey" PRIMARY KEY ("id_etiqueta")
);

-- CreateTable
CREATE TABLE "noticias_etiquetas" (
    "id_noticia" INTEGER NOT NULL,
    "id_etiqueta" INTEGER NOT NULL,

    CONSTRAINT "noticias_etiquetas_pkey" PRIMARY KEY ("id_noticia","id_etiqueta")
);

-- CreateTable
CREATE TABLE "imagenes" (
    "id_imagen" SERIAL NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" VARCHAR(255) NOT NULL,
    "alt_texto" VARCHAR(255),
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateTable
CREATE TABLE "noticias_imagenes" (
    "id_noticia" INTEGER NOT NULL,
    "id_imagen" INTEGER NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "descripcion_imagen" TEXT,

    CONSTRAINT "noticias_imagenes_pkey" PRIMARY KEY ("id_noticia","id_imagen")
);

-- CreateTable
CREATE TABLE "espacios_publicitarios" (
    "id_espacio" SERIAL NOT NULL,
    "nombre_espacio" VARCHAR(100) NOT NULL,
    "descripcion_espacio" TEXT,
    "dimensiones_recomendadas" VARCHAR(50),
    "precio" DECIMAL(10,2),
    "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',

    CONSTRAINT "espacios_publicitarios_pkey" PRIMARY KEY ("id_espacio")
);

-- CreateTable
CREATE TABLE "anuncios" (
    "id_anuncio" SERIAL NOT NULL,
    "id_espacio" INTEGER NOT NULL,
    "nombre_anunciante" VARCHAR(150),
    "imagen_anuncio" VARCHAR(255),
    "url_anuncio" VARCHAR(255),
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',

    CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id_anuncio")
);

-- CreateIndex
CREATE UNIQUE INDEX "secciones_nombre_seccion_key" ON "secciones"("nombre_seccion");

-- CreateIndex
CREATE UNIQUE INDEX "secciones_slug_seccion_key" ON "secciones"("slug_seccion");

-- CreateIndex
CREATE UNIQUE INDEX "autores_email_autor_key" ON "autores"("email_autor");

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_nombre_etiqueta_key" ON "etiquetas"("nombre_etiqueta");

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_slug_etiqueta_key" ON "etiquetas"("slug_etiqueta");

-- CreateIndex
CREATE UNIQUE INDEX "espacios_publicitarios_nombre_espacio_key" ON "espacios_publicitarios"("nombre_espacio");

-- AddForeignKey
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_id_seccion_fkey" FOREIGN KEY ("id_seccion") REFERENCES "secciones"("id_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "autores"("id_autor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticias_etiquetas" ADD CONSTRAINT "noticias_etiquetas_id_noticia_fkey" FOREIGN KEY ("id_noticia") REFERENCES "noticias"("id_noticia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticias_etiquetas" ADD CONSTRAINT "noticias_etiquetas_id_etiqueta_fkey" FOREIGN KEY ("id_etiqueta") REFERENCES "etiquetas"("id_etiqueta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticias_imagenes" ADD CONSTRAINT "noticias_imagenes_id_noticia_fkey" FOREIGN KEY ("id_noticia") REFERENCES "noticias"("id_noticia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticias_imagenes" ADD CONSTRAINT "noticias_imagenes_id_imagen_fkey" FOREIGN KEY ("id_imagen") REFERENCES "imagenes"("id_imagen") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_id_espacio_fkey" FOREIGN KEY ("id_espacio") REFERENCES "espacios_publicitarios"("id_espacio") ON DELETE RESTRICT ON UPDATE CASCADE;
