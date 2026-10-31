// import React, { useState, useEffect } from "react";
// import DataTable from "react-data-table-component";
// import axios from "axios";

// // Modal simple
// const Modal = ({ isOpen, onClose, children }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//       <div className="bg-white p-6 rounded-xl w-11/12 md:w-1/2 relative">
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-2 text-gray-700 font-bold text-xl"
//         >
//           &times;
//         </button>
//         {children}
//       </div>
//     </div>
//   );
// };

// const ListeProduits = () => {
//   const [produits, setProduits] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedProduit, setSelectedProduit] = useState(null);
//   const [modalType, setModalType] = useState(""); // "afficher" ou "modifier"
//   const [editData, setEditData] = useState({}); // Pour le formulaire de modification

//   // 🔹 Charger les produits depuis le backend
//   useEffect(() => {
//     const fetchProduits = async () => {
//       try {
//         const res = await axios.get("http://localhost:4999/api/allroute/getAllProduits");
//         setProduits(res.data.produit || []);
//         setLoading(false);
//       } catch (error) {
//         console.error("Erreur récupération produits :", error);
//         setLoading(false);
//       }
//     };
//     fetchProduits();
//   }, []);

//   // 🔹 Supprimer un produit
//   const handleDelete = async (id) => {
//     if (!window.confirm("⚠️ Voulez-vous vraiment supprimer ce produit ?")) return;

//     try {
//       await axios.delete(`http://localhost:4999/api/allroute/deleteProduit/${id}`);
//       setProduits(produits.filter((p) => p._id !== id));
//     } catch (error) {
//       console.error("Erreur suppression :", error);
//       alert("❌ Impossible de supprimer le produit.");
//     }
//   };

//   // 🔹 Ouvrir modal pour afficher ou modifier
//   const openModal = (produit, type) => {
//     setSelectedProduit(produit);
//     setModalType(type);
//     if (type === "modifier") {
//       setEditData({
//         quantite: produit.quantite,
//         prixAchat: produit.prixAchat,
//         prixVente: produit.prixVente,
//         stock_min: produit.stock_min,
//         date_ajout: produit.date_ajout.slice(0, 10),
//         date_expiration: produit.date_expiration.slice(0, 10),
//         alert_stock: produit.alert_stock,
//       });
//     }
//   };

//   const closeModal = () => {
//     setSelectedProduit(null);
//     setModalType("");
//     setEditData({});
//   };

//   // 🔹 Gestion modification formulaire
//   const handleEditChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setEditData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   // 🔹 Soumettre modification
//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.put(
//         `http://localhost:4999/api/allroute/updateProduit/${selectedProduit._id}`,
//         editData
//       );
//       // Mise à jour locale de la DataTable
//       setProduits(
//         produits.map((p) => (p._id === selectedProduit._id ? res.data.produit : p))
//       );
//       closeModal();
//     } catch (error) {
//       console.error("Erreur modification :", error);
//       alert("❌ Impossible de modifier le produit.");
//     }
//   };

//   // 🔹 Colonnes DataTable
//   const columns = [
//     { name: "Nom catégorie", selector: (row) => row.categorieNom, sortable: true },
//     { name: "Description", selector: (row) => row.categorieDescription, sortable: true },
//     { name: "Quantité", selector: (row) => row.quantite, sortable: true },
//     { name: "Prix Achat", selector: (row) => row.prixAchat, sortable: true },
//     { name: "Prix Vente", selector: (row) => row.prixVente, sortable: true },
//     { name: "Stock Min", selector: (row) => row.stock_min, sortable: true },
//     { name: "Stock", selector: (row) => row.stock, sortable: true },
//     { name: "Date ajout", selector: (row) => new Date(row.date_ajout).toLocaleDateString(), sortable: true },
//     { name: "Date expiration", selector: (row) => new Date(row.date_expiration).toLocaleDateString(), sortable: true },
//     {
//       name: "Image",
//       selector: (row) =>
//         row.image ? <img src={`http://localhost:4999/uploads/${row.image}`} alt="Produit" width="50" /> : "Pas d'image",
//     },
//     {
//       name: "Actions",
//       cell: (row) => (
//         <div className="flex gap-2">
//           <button
//             onClick={() => openModal(row, "afficher")}
//             className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
//           >
//             Afficher
//           </button>
//           <button
//             onClick={() => openModal(row, "modifier")}
//             className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
//           >
//             Modifier
//           </button>
//           <button
//             onClick={() => handleDelete(row._id)}
//             className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
//           >
//             Supprimer
//           </button>
//         </div>
//       ),
//       ignoreRowClick: true,
//       allowOverflow: true,
//       button: true,
//     },
//   ];

//   return (
//     <div className="max-w-7xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-10">
//       <h2 className="text-3xl font-bold text-gray-700 mb-6 text-center">📋 Liste des Produits</h2>

//       <DataTable
//         columns={columns}
//         data={produits}
//         pagination
//         highlightOnHover
//         striped
//         responsive
//         progressPending={loading}
//       />

//       {/* Modal */}
//       <Modal isOpen={!!selectedProduit} onClose={closeModal}>
//         {modalType === "afficher" && selectedProduit && (
//           <div>
//             <h2 className="text-2xl font-bold mb-4">{selectedProduit.categorieNom}</h2>
//             <p><strong>Description :</strong> {selectedProduit.categorieDescription}</p>
//             <p><strong>Quantité :</strong> {selectedProduit.quantite}</p>
//             <p><strong>Prix Achat :</strong> {selectedProduit.prixAchat}</p>
//             <p><strong>Prix Vente :</strong> {selectedProduit.prixVente}</p>
//             <p><strong>Stock Min :</strong> {selectedProduit.stock_min}</p>
//             <p><strong>Stock :</strong> {selectedProduit.stock}</p>
//             <p><strong>Date ajout :</strong> {new Date(selectedProduit.date_ajout).toLocaleDateString()}</p>
//             <p><strong>Date expiration :</strong> {new Date(selectedProduit.date_expiration).toLocaleDateString()}</p>
//             {selectedProduit.image && (
//               <img src={`http://localhost:4999/uploads/${selectedProduit.image}`} alt="Produit" className="mt-4 w-32 h-32 object-cover" />
//             )}
//           </div>
//         )}

//         {modalType === "modifier" && selectedProduit && (
//           <div>
//             <h2 className="text-2xl font-bold mb-4">Modifier {selectedProduit.categorieNom}</h2>
//             <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-4">
//               <input
//                 type="number"
//                 name="quantite"
//                 value={editData.quantite}
//                 onChange={handleEditChange}
//                 className="w-full p-2 border rounded"
//                 placeholder="Quantité"
//                 required
//               />
//               <input
//                 type="number"
//                 name="prixAchat"
//                 value={editData.prixAchat}
//                 onChange={handleEditChange}
//                 className="w-full p-2 border rounded"
//                 placeholder="Prix Achat"
//                 required
//               />
//               <input
//                 type="number"
//                 name="prixVente"
//                 value={editData.prixVente}
//                 onChange={handleEditChange}
//                 className="w-full p-2 border rounded"
//                 placeholder="Prix Vente"
//                 required
//               />
//               <input
//                 type="number"
//                 name="stock_min"
//                 value={editData.stock_min}
//                 onChange={handleEditChange}
//                 className="w-full p-2 border rounded"
//                 placeholder="Stock Min"
//                 required
//               />
//               <input
//                 type="date"
//                 name="date_ajout"
//                 value={editData.date_ajout}
//                 onChange={handleEditChange}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 name="date_expiration"
//                 value={editData.date_expiration}
//                 onChange={handleEditChange}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   name="alert_stock"
//                   checked={editData.alert_stock}
//                   onChange={handleEditChange}
//                 />
//                 Activer alerte stock
//               </label>
//               <button type="submit" className="bg-green-500 text-white py-2 rounded hover:bg-green-600">
//                 Enregistrer modifications
//               </button>
//             </form>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default ListeProduits;
