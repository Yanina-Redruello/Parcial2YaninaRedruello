// clase Producto
class Producto {
    constructor(id, nombre, descripcion, precio, imagen, categoria, stock) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.imagen = imagen;
        this.categoria = categoria;
        this.stock = stock;
    }
}

// Clase Carrito 
class Carrito {
    constructor() {
        this.productos = JSON.parse(localStorage.getItem("carrito")) || [];
    }

    agregarProducto(producto) {
        let productoExistente = this.productos.find(p => p.id === producto.id);
        
        if (productoExistente) {
            productoExistente.cantidad++;
        } else {
            producto.cantidad = 1;
            this.productos.push(producto);
        }
        this.guardarCarrito();
    }

    eliminarProducto(id) {
        this.productos = this.productos.filter(p => p.id !== id);
        this.guardarCarrito();
    }

    // poder disminuir la cantidad de un producto en el carrito
    disminuirProducto(id) {
        let productoExistente = this.productos.find(p => p.id === id);
        
        if (productoExistente && productoExistente.cantidad > 1) {
            productoExistente.cantidad--;
        } else {
            this.eliminarProducto(id); // Si llego a 0, se elimina el producto del carrito
        }
        this.guardarCarrito();
    }

    calcularTotal() {
        return this.productos.reduce((total, producto) => total + producto.precio * producto.cantidad, 0);
    }

    guardarCarrito() {
        localStorage.setItem("carrito", JSON.stringify(this.productos));
    }
}

// ref del DOM
let miCarrito;
const carritoBtn = document.querySelector("#carritoBtn");
const carritoInfo = document.querySelector("#carrito-info");
const productosContainer = document.querySelector("#productos-container");
const modalCarrito = new bootstrap.Modal(document.getElementById("modal-carrito"));
const modalDetalleProducto = new bootstrap.Modal(document.getElementById("modal-detalle-producto"));
const botonVaciarCarrito = document.querySelector("#vaciar-carrito");
const filtroCategoria = document.querySelector("#filtro-categoria");
const ordenarPrecio = document.querySelector("#ordenar-precio");

// arrancar el carrito cuando DOM esté ok
document.addEventListener("DOMContentLoaded", () => {
    miCarrito = new Carrito();
    cargarCategorias();
    cargarProductos();
    actualizarCarritoVisual();

    carritoBtn.addEventListener("click", () => {
        mostrarCarrito();
        modalCarrito.show();
    });

    botonVaciarCarrito.addEventListener("click", () => {
        vaciarCarrito();
    });

    filtroCategoria.addEventListener("change", (e) => {
        cargarProductos(e.target.value);
    });

    ordenarPrecio.addEventListener("change", (e) => {
        ordenarProductos(e.target.value);
    });

    productosContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("ver-detalle")) {
            const productoId = e.target.getAttribute("data-id");
            mostrarDetalleProducto(productoId);
        }
    });
});

// Cargar productos desde el archivo JSON y mostrarlos en el DOM
function obtenerProductos() {
    return fetch('productos.json')
        .then(response => response.json())
        .catch(error => console.error('Error al cargar los productos:', error));
}

function cargarProductos(filtroCategoria = "") {
    obtenerProductos().then(data => {
        if (filtroCategoria) {
            data = data.filter(producto => producto.categoria === filtroCategoria);
        }
        mostrarProductos(data);
    });
}

function mostrarProductos(productos) {
    productosContainer.innerHTML = ""; // Limpio el contenedor

    productos.forEach(prod => {
        const productoCard = document.createElement('div');
        productoCard.classList.add('producto-card', 'col-md-4', 'card', 'p-3', 'm-1', 'shadow-sm');

        const img = document.createElement('img');
        img.classList.add('card-img-top');
        img.setAttribute('src', prod.imagen);
        img.setAttribute('alt', prod.nombre);

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const nombre = document.createElement('h5');
        nombre.classList.add('card-title');
        nombre.textContent = prod.nombre;

        const descripcion = document.createElement('p');
        descripcion.classList.add('card-text');
        descripcion.textContent = prod.descripcion;

        const precio = document.createElement('p');
        precio.classList.add('card-text', 'fw-bold');
        precio.textContent = `$${prod.precio}`;

        cardBody.append(nombre, descripcion, precio);

        if (prod.stock > 0) {
            const botonAgregar = document.createElement('button');
            botonAgregar.classList.add('btn', 'btn-primary', 'w-100', 'mb-2');
            botonAgregar.textContent = "Agregar al carrito";
            botonAgregar.addEventListener('click', () => {
                miCarrito.agregarProducto(prod);
                actualizarCarritoVisual();
                
                const textoOriginal = botonAgregar.textContent;
                botonAgregar.textContent = "Producto añadido al carrito";
                botonAgregar.disabled = true;

                setTimeout(() => {
                    botonAgregar.textContent = textoOriginal;
                    botonAgregar.disabled = false;
                }, 2000);
            });

            const botonVerDetalle = document.createElement('button');
            botonVerDetalle.classList.add('btn', 'btn-secondary', 'w-100', 'mt-2', 'ver-detalle');
            botonVerDetalle.textContent = "Ver Detalle";
            botonVerDetalle.setAttribute("data-id", prod.id);

            cardBody.append(botonAgregar, botonVerDetalle);
        } else {
            const sinStock = document.createElement('p');
            sinStock.classList.add('text-danger', 'fw-bold', 'mb-2', 'text-center');
            sinStock.textContent = "Sin stock";
            cardBody.appendChild(sinStock);
        }

        productoCard.append(img, cardBody);
        productosContainer.appendChild(productoCard);
    });
}

function mostrarDetalleProducto(productoId) {
    obtenerProductos().then(data => {
        const producto = data.find(prod => prod.id == productoId);
        if (producto) {
            document.getElementById("detalle-producto-contenido").innerHTML = generarHTMLProducto(producto);
            const botonAgregarModal = document.getElementById("agregar-al-carrito-modal");
            botonAgregarModal.onclick = () => {
                miCarrito.agregarProducto(producto);
                actualizarCarritoVisual();
                
                const textoOriginal = botonAgregarModal.textContent;
                botonAgregarModal.textContent = "Producto añadido al carrito";
                botonAgregarModal.disabled = true;

                setTimeout(() => {
                    botonAgregarModal.textContent = textoOriginal;
                    botonAgregarModal.disabled = false;
                }, 2000);
            };
            modalDetalleProducto.show();
        }
    });
}

function generarHTMLProducto(producto) {
    return `
        <div class="text-center">
            <img src="${producto.imagen}" alt="${producto.nombre}" class="img-fluid mb-3">
        </div>
        <h5>${producto.nombre}</h5>
        <p>${producto.descripcion}</p>
        <p><strong>Precio:</strong> $${producto.precio}</p>
        <p><strong>Stock disponible:</strong> ${producto.stock}</p>
    `;
}

function ordenarProductos(criterio) {
    obtenerProductos().then(data => {
        if (criterio === "menor-mayor") {
            data.sort((a, b) => a.precio - b.precio);
        } else if (criterio === "mayor-menor") {
            data.sort((a, b) => b.precio - a.precio);
        }
        mostrarProductos(data);
    });
}

function cargarCategorias() {
    obtenerProductos().then(data => {
        const categorias = [...new Set(data.map(producto => producto.categoria))];
        filtroCategoria.innerHTML = '<option value="">Todas</option>'; // limpio y pongo "Todas"

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            filtroCategoria.appendChild(option);
        });
    });
}

function actualizarCarritoVisual() {
    const cantidadTotal = miCarrito.productos.reduce((total, producto) => total + producto.cantidad, 0);
    const montoTotal = miCarrito.calcularTotal();

    document.querySelector("#cantidad-productos").innerText = cantidadTotal;
    document.querySelector("#monto-total").innerText = `$${montoTotal}`;
    document.querySelector("#cantidad-productos-carrito").innerText = cantidadTotal;
}


// muestro el carrito
function mostrarCarrito() {
    let contenidoCarrito = document.querySelector(".contenido-carrito");
    contenidoCarrito.innerHTML = "";

    if (miCarrito.productos.length === 0) {
        contenidoCarrito.innerHTML = "<p class='text-center'>¡Oops! El carrito está vacío.</p>";
        actualizarBotonCarrito(true);
    } else {
        miCarrito.productos.forEach(producto => {
            let itemCarrito = document.createElement("div");
            itemCarrito.classList.add('d-flex', 'align-items-center', 'justify-content-between', 'border-bottom', 'pb-2', 'mb-2');

            const img = document.createElement('img');
            img.setAttribute('src', producto.imagen);
            img.setAttribute('alt', producto.nombre);
            img.classList.add('me-3', 'img-thumbnail');
            img.style.width = '60px';

            const detalles = document.createElement('div');
            detalles.classList.add('flex-grow-1');

            const nombre = document.createElement('p');
            nombre.classList.add('mb-1', 'fw-bold');
            nombre.textContent = `${producto.nombre} x${producto.cantidad}`;

            const precio = document.createElement('p');
            precio.classList.add('mb-0');
            precio.textContent = `$${producto.precio * producto.cantidad}`;

            detalles.append(nombre, precio);

            const botonesCantidad = document.createElement('div');
            botonesCantidad.classList.add('d-flex', 'gap-2', 'align-items-center', 'mt-2');

            const botonAumentar = document.createElement('button');
            botonAumentar.classList.add('btn', 'btn-success', 'btn-sm');
            botonAumentar.textContent = '+';
            botonAumentar.addEventListener('click', () => modificarCantidadProducto(producto.id, true));

            const botonDisminuir = document.createElement('button');
            botonDisminuir.classList.add('btn', 'btn-warning', 'btn-sm');
            botonDisminuir.textContent = '-';
            botonDisminuir.addEventListener('click', () => modificarCantidadProducto(producto.id, false));

            botonesCantidad.append(botonAumentar, botonDisminuir);

            // Botón para eliminar el producto del carrito
            const botonEliminar = document.createElement('button');
            botonEliminar.classList.add('btn', 'btn-danger', 'btn-sm');
            botonEliminar.textContent = "Eliminar";
            botonEliminar.addEventListener('click', () => {
                miCarrito.eliminarProducto(producto.id);
                mostrarCarrito();
                actualizarCarritoVisual();
            });

            itemCarrito.append(img, detalles, botonesCantidad, botonEliminar);
            contenidoCarrito.appendChild(itemCarrito);
        });

        actualizarBotonCarrito(false);
    }

    document.getElementById("modal-monto-total").innerText = `$${miCarrito.calcularTotal()}`;
}

function modificarCantidadProducto(id, aumentar) {
    if (aumentar) {
        miCarrito.agregarProducto(miCarrito.productos.find(p => p.id === id));
    } else {
        miCarrito.disminuirProducto(id);
    }
    mostrarCarrito();
    actualizarCarritoVisual();
}

function vaciarCarrito() {
    miCarrito.productos = [];
    miCarrito.guardarCarrito();
    mostrarCarrito();
    actualizarCarritoVisual();
}

function actualizarBotonCarrito(carritoVacio) {
    if (carritoVacio) {
        botonVaciarCarrito.textContent = "Ver Productos";
        botonVaciarCarrito.classList.remove("btn-warning");
        botonVaciarCarrito.classList.add("btn-primary");
        botonVaciarCarrito.removeEventListener("click", vaciarCarrito);
        botonVaciarCarrito.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    } else {
        botonVaciarCarrito.textContent = "Vaciar Carrito";
        botonVaciarCarrito.classList.remove("btn-primary");
        botonVaciarCarrito.classList.add("btn-warning");
        botonVaciarCarrito.removeEventListener("click", () => window.location.href = "index.html");
        botonVaciarCarrito.addEventListener("click", vaciarCarrito);
    }
}
