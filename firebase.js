// ============================================
//   La Receta De Elaine — firebase.js
//   Maneja toda la conexión con Firestore
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyClKlnEvSw_mlAUNPYYxWx3J8B1AJX7iI4",
  authDomain: "la-receta-de-elaine.firebaseapp.com",
  projectId: "la-receta-de-elaine",
  storageBucket: "la-receta-de-elaine.firebasestorage.app",
  messagingSenderId: "534392999713",
  appId: "1:534392999713:web:ebc63076714761c3997860"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ============================================
   POSTRES DEL DÍA — Firestore
   Colección: "postres_del_dia"
   ============================================ */

// Escuchar cambios en tiempo real
export function escucharPostresDia(callback) {
  const ref = collection(db, "postres_del_dia");
  return onSnapshot(ref, snapshot => {
    const lista = [];
    snapshot.forEach(d => lista.push({ fireId: d.id, ...d.data() }));
    callback(lista);
  });
}

// Agregar postre del día
export async function agregarPostreDia(data) {
  const ref = collection(db, "postres_del_dia");
  const docRef = await addDoc(ref, data);
  return docRef.id;
}

// Eliminar postre del día
export async function eliminarPostreDia(fireId) {
  await setDoc(doc(db, "postres_del_dia", fireId), {}, { merge: false });
  const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
  await deleteDoc(doc(db, "postres_del_dia", fireId));
}

// Descontar stock al confirmar pedido
export async function descontarStock(fireId, cantidad) {
  const ref = doc(db, "postres_del_dia", fireId);
  await updateDoc(ref, { stock: increment(-cantidad) });
}

/* ============================================
   PEDIDOS — Firestore
   Colección: "pedidos"
   ============================================ */

// Guardar pedido y obtener folio
export async function guardarPedido(pedido) {
  // Obtener y actualizar contador de folios
  const contadorRef = doc(db, "config", "contador");
  const contadorSnap = await getDoc(contadorRef);
  let folio = 1;
  if (contadorSnap.exists()) {
    folio = (contadorSnap.data().ultimo || 0) + 1;
  }
  await setDoc(contadorRef, { ultimo: folio });

  // Guardar pedido
  const folioStr = String(folio).padStart(4, "0");
  await addDoc(collection(db, "pedidos"), {
    ...pedido,
    folio: folioStr,
    fecha: new Date().toISOString()
  });

  return folioStr;
}
