import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import React from "react";

const LawyerDash = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/lawyer/${userId}`, { 
            method: "GET",
            credentials: "include", 
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(res => {
            console.log(res);
            return res.json();
        })
        .then(data => {
            console.log("Fetched cases:", data.cases);
            setCases(data.cases || []);
        })
        .catch(err => console.error("Error fetching cases:", err));
    }, [userId]);
    
    const handleSearch = (event) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    const togglePopup = () => {
        setShowForm(!showForm);
    };

    const confirmSendToRegistrar = (caseId) => {
        if (window.confirm("Are you sure you want to send this case to the registrar?")) {
            fetch(`/send-to-registrar/${caseId}`, { method: "POST" })
                .then(() => window.location.reload()) // Refresh cases
                .catch(err => console.error("Error sending case:", err));
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen">
            <nav className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 flex justify-between items-center">
                <div className="flex space-x-6">
                <Link to={`/lawyer/${userId}`} className="hover:text-gray-300">Home</Link>
                <a href={`/lawyer/mycases/${userId}`} className="hover:text-gray-300">My Cases</a>
                    <a href="/lawyer/availableregistrar" className="hover:text-gray-300">Available Registrars</a>
                </div>
                <button onClick={() => {
        fetch("http://127.0.0.1:8000/logout", { 
            method: "POST", 
            credentials: "include",  
        })
        .then(res => {
            if (res.ok) {
                navigate("/");  // Redirect to home/login page
            } else {
                console.error("Logout failed");
            }
        })
        .catch(err => console.error("Logout error:", err));
    }}
    className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600">Logout</button>
            </nav>

            <div className="container mx-auto p-6">
                <h2 className="text-3xl font-bold text-gray-800">Welcome to the Lawyer Dashboard</h2>
                <p className="text-gray-600">Manage your cases efficiently.</p>

                <input type="text" placeholder="Search by title..." className="mt-4 w-full p-2 border border-gray-300 rounded-lg" onChange={handleSearch} />
                
                <h3 className="text-2xl font-semibold mt-6">My Cases</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                    {cases.length ? cases.filter(c => c.title.toLowerCase().includes(searchTerm)).map(caseItem => (
                        <div key={caseItem._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
                            <a href={`/posts/${caseItem._id}`} className="text-xl font-semibold text-blue-900 hover:underline">{caseItem.title}</a>
                            <p className="text-sm font-medium text-orange-500 mt-2"><strong>Type:</strong> {caseItem.case_type}</p>
                            <p className="text-gray-700 mt-3">{caseItem.content}</p>
                            <form action={`/send-to-registrar/${caseItem._id}`} method="post" className="mt-4">
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700" onClick={() => confirmSendToRegistrar(caseItem._id)}>Send to Registrar</button>
                            </form>
                        </div>
                    )) : <p className="text-gray-500">No Cases</p>}
                </div>
            </div>

            <button className="fixed bottom-6 right-6 bg-orange-500 text-white p-5 rounded-full shadow-lg text-xl hover:bg-orange-600" onClick={togglePopup}>+</button>
            
            {showForm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold text-gray-800 text-center">Upload Case</h2>
                        <form action={`/lawyer/${userId}`} method="post" className="mt-4 space-y-4">
                            <input type="text" name="title" placeholder="Case Title" required className="w-full p-2 border border-gray-300 rounded-lg" />
                            <textarea name="content" placeholder="Case Details" required className="w-full p-2 border border-gray-300 rounded-lg"></textarea>
                            <select name="case_type" required className="w-full p-2 border border-gray-300 rounded-lg">
                                <option value="criminal">Criminal</option>
                                <option value="civil">Civil</option>
                                <option value="family">Family</option>
                                <option value="corporate">Corporate</option>
                                <option value="intellectual">Intellectual Property</option>
                                <option value="cybercrime">Cybercrime</option>
                            </select>
                            <input type="text" name="party1_uid" placeholder="Party 1 UID" required className="w-full p-2 border border-gray-300 rounded-lg" />
                            <input type="text" name="party2_uid" placeholder="Party 2 UID" required className="w-full p-2 border border-gray-300 rounded-lg" />
                            <label className="text-gray-700 font-semibold">Date of Filing:</label>
                            <input type="date" name="date_of_filing" required className="w-full p-2 border border-gray-300 rounded-lg" />
                            <label className="text-gray-700 font-semibold">Last Updated On:</label>
                            <input type="date" name="updated_on" required className="w-full p-2 border border-gray-300 rounded-lg" />
                            <label className="text-gray-700 font-semibold">Upload Case Files:</label>
                            <input type="file" name="files" multiple required className="w-full p-2 border border-gray-300 rounded-lg" />
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Submit</button>
                        </form>
                        <button onClick={togglePopup} className="mt-4 text-gray-500 hover:text-gray-700 block mx-auto">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerDash;
