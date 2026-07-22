export const PYTHON_STREAMLIT_CODE = `import io
import streamlit as st
from PIL import Image
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

# ==========================================
# CONFIGURACIÓN DE PÁGINA Y CONSTANTES
# ==========================================
A4_WIDTH, A4_HEIGHT = landscape(A4)  # 297mm x 210mm en puntos (841.89 x 595.27 pt)
A5_WIDTH = A4_WIDTH / 2.0           # 148.5mm por página A5

# Esquema de Imposición Matemática Exacta para 12 Páginas (3 Hojas A4 Doble Cara)
IMPOSITION_PLAN = [
    {"hoja": "Hoja 1 (Exterior) - Cara Delantera", "izq": 12, "der": 1},
    {"hoja": "Hoja 1 (Exterior) - Cara Trasera",   "izq": 2,  "der": 11},
    {"hoja": "Hoja 2 (Intermedia) - Cara Delantera","izq": 10, "der": 3},
    {"hoja": "Hoja 2 (Intermedia) - Cara Trasera",  "izq": 4,  "der": 9},
    {"hoja": "Hoja 3 (Interior) - Cara Delantera",  "izq": 8,  "der": 5},
    {"hoja": "Hoja 3 (Interior) - Cara Trasera (Centro)", "izq": 6, "der": 7},
]

def render_page_image(pil_img, fit_mode, bg_color):
    """
    Adapta la imagen al tamaño A5 (148.5 x 210 mm) aplicando el ajuste deseado (cover/contain/stretch).
    """
    target_w, target_h = 1754, 2480  # Resolución ~300 DPI para A5
    canvas_img = Image.new("RGB", (target_w, target_h), bg_color)
    
    if pil_img is None:
        return canvas_img

    img_w, img_h = pil_img.size
    
    if fit_mode == "stretch":
        resized = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        canvas_img.paste(resized, (0, 0))
    elif fit_mode == "contain":
        scale = min(target_w / img_w, target_h / img_h)
        new_w, new_h = int(img_w * scale), int(img_h * scale)
        resized = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (target_w - new_w) // 2
        offset_y = (target_h - new_h) // 2
        canvas_img.paste(resized, (offset_x, offset_y))
    elif fit_mode == "cover":
        scale = max(target_w / img_w, target_h / img_h)
        new_w, new_h = int(img_w * scale), int(img_h * scale)
        resized = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (target_w - new_w) // 2
        offset_y = (target_h - new_h) // 2
        
        # Recortar al canvas
        crop_box = (-offset_x, -offset_y, target_w - offset_x, target_h - offset_y)
        canvas_img = resized.crop(crop_box)
        
    return canvas_img

def build_fanzine_pdf(images_dict, gutter_mm, fit_mode, show_fold_lines, show_numbers, bg_color):
    """
    Genera un archivo PDF A4 horizontal con 6 páginas (3 hojas a doble cara).
    """
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=landscape(A4))
    
    gutter_pt = gutter_mm * mm

    for spread in IMPOSITION_PLAN:
        left_num = spread["izq"]
        right_num = spread["der"]
        
        img_left = images_dict.get(left_num)
        img_right = images_dict.get(right_num)

        # Procesar imágenes
        processed_left = render_page_image(img_left, fit_mode, bg_color)
        processed_right = render_page_image(img_right, fit_mode, bg_color)

        # Convertir a buffer para ReportLab
        buf_left = io.BytesIO()
        processed_left.save(buf_left, format="JPEG", quality=92)
        buf_left.seek(0)

        buf_right = io.BytesIO()
        processed_right.save(buf_right, format="JPEG", quality=92)
        buf_right.seek(0)

        # Dimensiones y coordenadas con compensación de lomo (Gutter)
        # Página Izquierda: desplazada ligeramente a la izquierda alejándose del centro
        left_w = A5_WIDTH - gutter_pt
        left_x = 0
        left_y = 0
        left_h = A4_HEIGHT

        # Página Derecha: desplazada a la derecha iniciando después del centro + gutter
        right_w = A5_WIDTH - gutter_pt
        right_x = A5_WIDTH + gutter_pt
        right_y = 0
        right_h = A4_HEIGHT

        # Dibujar imagen izquierda
        c.drawImage(buf_left, left_x, left_y, width=left_w, height=left_h)

        # Dibujar imagen derecha
        c.drawImage(buf_right, right_x, right_y, width=right_w, height=right_h)

        # Numeración de página discreta opcional
        if show_numbers:
            c.setFillColorRGB(0.1, 0.1, 0.1)
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(left_w / 2.0, 10 * mm, f"- {left_num} -")
            c.drawCentredString(right_x + (right_w / 2.0), 10 * mm, f"- {right_num} -")

        # Guía central de doblado opcional
        if show_fold_lines:
            c.setStrokeColorRGB(0.7, 0.7, 0.7)
            c.setLineWidth(0.5)
            c.setDash(4, 4)
            c.line(A5_WIDTH, 0, A5_WIDTH, A4_HEIGHT)

        c.showPage()  # Pasa a la siguiente cara A4

    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()


# ==========================================
# INTERFAZ WEB INTERACTIVA EN STREAMLIT
# ==========================================
def main():
    st.set_page_config(page_title="Generador Fanzine 12 Páginas", page_icon="📖", layout="wide")
    st.title("📖 Generador Automático de Fanzine 12 Páginas")
    st.subheader("Imposición para Impresión en Cuadernillo A4 (3 Hojas Doble Cara)")
    
    st.markdown("""
    Esta herramienta ajusta automáticamente 12 imágenes consecutivas en 3 hojas A4 horizontales con la **imposición matemática exacta** para doblar y engrapar.
    """)

    # Sidebar con ajustes de maquetación
    st.sidebar.header("⚙️ Ajustes de Maquetación")
    gutter_mm = st.sidebar.slider("Compensación de Lomo / Gutter (mm)", 0.0, 10.0, 2.0, 0.5,
                                  help="Margen de seguridad central para evitar ocultar texto en el pliegue.")
    fit_mode = st.sidebar.selectbox("Ajuste de Imágenes", ["cover", "contain", "stretch"],
                                    format_func=lambda x: {"cover": "Rellenar / Cubrir (Cover)", 
                                                           "contain": "Ajustar entero (Contain)", 
                                                           "stretch": "Estirar (Stretch)"}[x])
    bg_color = st.sidebar.color_picker("Color de Fondo (márgenes)", "#FFFFFF")
    show_fold_lines = st.sidebar.checkbox("Mostrar línea central de doblado", True)
    show_numbers = st.sidebar.checkbox("Añadir números de página en pie", True)

    # Carga de imágenes
    st.header("1. Carga las 12 Imágenes en Orden de Lectura (1 a 12)")
    
    uploaded_files = st.file_uploader(
        "Sube las 12 imágenes del fanzine (JPG o PNG):",
        type=["jpg", "jpeg", "png", "webp"],
        accept_multiple_files=True
    )

    images_dict = {}
    
    cols = st.columns(6)
    for i in range(1, 13):
        col = cols[(i - 1) % 6]
        with col:
            st.markdown(f"**Página {i}**" + (" *(Portada)*" if i == 1 else " *(Contra)*" if i == 12 else ""))
            
            # Buscar si el usuario subió archivo ordenado
            matching_file = None
            if uploaded_files:
                if len(uploaded_files) >= i:
                    matching_file = uploaded_files[i - 1]

            single_file = st.file_uploader(f"Img Pág {i}", type=["jpg", "png", "webp"], key=f"file_p{i}", label_visibility="collapsed")
            
            selected_file = single_file if single_file is not None else matching_file

            if selected_file:
                try:
                    img = Image.open(selected_file).convert("RGB")
                    images_dict[i] = img
                    st.image(img, use_container_width=True)
                except Exception as e:
                    st.error("Error en imagen")
            else:
                st.info(f"Sin imagen {i}")

    # Visualización de la Imposición
    st.header("2. Esquema de Imposición Generado")
    st.markdown("Verifica cómo quedará cada cara impreso en las 3 hojas A4:")

    imp_cols = st.columns(3)
    for idx, spread in enumerate(IMPOSITION_PLAN):
        col = imp_cols[idx // 2]
        with col:
            st.caption(f"📄 **{spread['hoja']}**")
            st.write(f"⬅️ Izquierda: **Página {spread['izq']}** | ➡️ Derecha: **Página {spread['der']}**")

    # Botón de Generación de PDF
    st.header("3. Generar y Descargar PDF Listo para Imprimir")
    
    if st.button("🚀 Generar PDF Cuadernillo A4", type="primary", use_container_width=True):
        if len(images_dict) < 12:
            st.warning(f"⚠️ Has subido {len(images_dict)} de 12 páginas. Las páginas faltantes aparecerán en blanco.")
        
        with st.spinner("Procesando imágenes y aplicando imposición matemática..."):
            pdf_bytes = build_fanzine_pdf(images_dict, gutter_mm, fit_mode, show_fold_lines, show_numbers, bg_color)
            
            st.success("✅ ¡PDF generado con éxito!")
            st.download_button(
                label="📥 Descargar PDF Fanzine (A4 Doble Cara)",
                data=pdf_bytes,
                file_name="fanzine_12_paginas_impresion_a4.pdf",
                mime="application/pdf",
                use_container_width=True
            )
            st.info("💡 **Instrucción de Impresión:** Imprime en hoja A4 horizontal a doble cara seleccionando **'Girar en el borde corto'** (Voltear por borde corto).")

if __name__ == "__main__":
    main()
`;
