import React, { useState, useEffect } from 'react';
import { User, Car, Search, MessageCircle, UserCircle, Plus, MapPin, Clock, Calendar, Users, X, Send, Trash2 } from 'lucide-react';

const CarpoolApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [rides, setRides] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    date: '',
    time: '',
    pickup: '',
    destination: ''
  });

  // Auth form state
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Create ride form state
  const [createRideForm, setCreateRideForm] = useState({
    date: '',
    time: '',
    vehicle: '',
    pickup: '',
    destination: '',
    seats: 1
  });

  // Chat state
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Utility functions
  const isUniversityEmail = (email) => {
    return email.includes('.edu') || email.includes('university') || email.includes('college');
  };

  const calculatePrice = (pickup, destination) => {
    // Simulate distance calculation (in real app, you'd use mapping API)
    const baseDistance = Math.random() * 100 + 10; // 10-110 miles
    const price = (baseDistance * 0.19) + 3;
    return { distance: Math.round(baseDistance), price: Math.round(price * 100) / 100 };
  };

  const handleAuth = (e) => {
    e.preventDefault();
    
    if (authMode === 'signup') {
      if (!isUniversityEmail(authForm.email)) {
        alert('Please use a valid university email address (.edu)');
        return;
      }
      
      const newUser = {
        id: Date.now(),
        name: authForm.name,
        email: authForm.email,
        password: authForm.password
      };
      
      setCurrentUser(newUser);
      setShowAuth(false);
    } else {
      // Simple login simulation
      if (authForm.email && authForm.password) {
        const user = {
          id: Date.now(),
          name: authForm.email.split('@')[0],
          email: authForm.email,
          password: authForm.password
        };
        setCurrentUser(user);
        setShowAuth(false);
      }
    }
    
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleCreateRide = (e) => {
    e.preventDefault();
    
    const { distance, price } = calculatePrice(createRideForm.pickup, createRideForm.destination);
    
    const newRide = {
      id: Date.now(),
      hostId: currentUser.id,
      hostName: currentUser.name,
      date: createRideForm.date,
      time: createRideForm.time,
      vehicle: createRideForm.vehicle,
      pickup: createRideForm.pickup,
      destination: createRideForm.destination,
      totalSeats: parseInt(createRideForm.seats),
      availableSeats: parseInt(createRideForm.seats),
      distance,
      price,
      passengers: []
    };
    
    setRides([...rides, newRide]);
    setCreateRideForm({
      date: '',
      time: '',
      vehicle: '',
      pickup: '',
      destination: '',
      seats: 1
    });
    
    alert('Ride posted successfully!');
  };

  const joinRide = (rideId) => {
    setRides(rides.map(ride => {
      if (ride.id === rideId && ride.availableSeats > 0 && !ride.passengers.some(p => p.id === currentUser.id)) {
        const updatedRide = {
          ...ride,
          availableSeats: ride.availableSeats - 1,
          passengers: [...ride.passengers, { id: currentUser.id, name: currentUser.name }]
        };
        
        // Start a chat
        const existingChat = chats.find(chat => 
          (chat.user1.id === currentUser.id && chat.user2.id === ride.hostId) ||
          (chat.user2.id === currentUser.id && chat.user1.id === ride.hostId)
        );
        
        if (!existingChat) {
          const newChat = {
            id: Date.now(),
            user1: currentUser,
            user2: { id: ride.hostId, name: ride.hostName },
            messages: [{
              id: Date.now(),
              senderId: currentUser.id,
              text: `Hi! I just joined your ride from ${ride.pickup} to ${ride.destination} on ${ride.date}.`,
              timestamp: new Date().toISOString()
            }]
          };
          setChats([...chats, newChat]);
        }
        
        return updatedRide;
      }
      return ride;
    }));
  };

  const leaveRide = (rideId) => {
    setRides(rides.map(ride => {
      if (ride.id === rideId && ride.passengers.some(p => p.id === currentUser.id)) {
        return {
          ...ride,
          availableSeats: ride.availableSeats + 1,
          passengers: ride.passengers.filter(p => p.id !== currentUser.id)
        };
      }
      return ride;
    }));
  };

  const removePassenger = (rideId, passengerId) => {
    setRides(rides.map(ride => {
      if (ride.id === rideId && ride.hostId === currentUser.id) {
        return {
          ...ride,
          availableSeats: ride.availableSeats + 1,
          passengers: ride.passengers.filter(p => p.id !== passengerId)
        };
      }
      return ride;
    }));
  };

  const deleteRide = (rideId) => {
    setRides(rides.filter(ride => ride.id !== rideId));
  };

  const markRideCompleted = (rideId) => {
    setRides(rides.filter(ride => ride.id !== rideId));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const message = {
      id: Date.now(),
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setChats(chats.map(chat => 
      chat.id === activeChat.id 
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));
    
    setNewMessage('');
  };

  const deleteChat = (chatId) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (activeChat && activeChat.id === chatId) {
      setActiveChat(null);
    }
  };

  const getFilteredRides = () => {
    return rides.filter(ride => {
      if (searchFilters.date && ride.date !== searchFilters.date) return false;
      if (searchFilters.pickup && !ride.pickup.toLowerCase().includes(searchFilters.pickup.toLowerCase())) return false;
      if (searchFilters.destination && !ride.destination.toLowerCase().includes(searchFilters.destination.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      // Sort by closest match (simplified)
      return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
    });
  };

  const getUserHostedRides = () => {
    return rides.filter(ride => ride.hostId === currentUser.id);
  };

  const getUserJoinedRides = () => {
    return rides.filter(ride => ride.passengers.some(p => p.id === currentUser.id));
  };

  const getUserChats = () => {
    return chats.filter(chat => 
      chat.user1.id === currentUser.id || chat.user2.id === currentUser.id
    );
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Car className="mx-auto mb-4 text-blue-600" size={48} />
            <h1 className="text-3xl font-bold text-gray-800">University Carpool</h1>
            <p className="text-gray-600 mt-2">Connect. Share. Travel.</p>
          </div>
          
          <div className="flex mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 text-center rounded-l-lg ${
                authMode === 'login' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 px-4 text-center rounded-r-lg ${
                authMode === 'signup' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            )}
            <input
              type="email"
              placeholder="University Email (.edu)"
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
          
          {authMode === 'signup' && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              * Must use a valid university email address
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-blue-600" size={32} />
            <h1 className="text-xl font-bold text-gray-800">University Carpool</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
            <span>{currentUser.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Search size={20} />
                Find a Ride
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters({...searchFilters, date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={searchFilters.time}
                    onChange={(e) => setSearchFilters({...searchFilters, time: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={searchFilters.pickup}
                    onChange={(e) => setSearchFilters({...searchFilters, pickup: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input
                    type="text"
                    placeholder="Enter destination"
                    value={searchFilters.destination}
                    onChange={(e) => setSearchFilters({...searchFilters, destination: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Available Rides */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Rides</h3>
              {getFilteredRides().map((ride) => (
                <div key={ride.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{ride.hostName}</h4>
                      <p className="text-gray-600">{ride.vehicle}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${ride.price}</div>
                      <div className="text-sm text-gray-500">{ride.distance} miles</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{ride.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>{ride.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span>{ride.pickup}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span>{ride.destination}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} />
                      <span>{ride.availableSeats} of {ride.totalSeats} seats available</span>
                    </div>
                    
                    {ride.hostId !== currentUser.id && ride.availableSeats > 0 && 
                     !ride.passengers.some(p => p.id === currentUser.id) && (
                      <button
                        onClick={() => joinRide(ride.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Join Ride
                      </button>
                    )}
                    
                    {ride.passengers.some(p => p.id === currentUser.id) && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        Joined
                      </span>
                    )}
                    
                    {ride.availableSeats === 0 && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        Full
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} />
              Create a Ride
            </h2>
            <form onSubmit={handleCreateRide} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={createRideForm.date}
                    onChange={(e) => setCreateRideForm({...createRideForm, date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={createRideForm.time}
                    onChange={(e) => setCreateRideForm({...createRideForm, time: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Description</label>
                <input
                  type="text"
                  placeholder="e.g., Blue Honda Civic, License: ABC123"
                  value={createRideForm.vehicle}
                  onChange={(e) => setCreateRideForm({...createRideForm, vehicle: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={createRideForm.pickup}
                    onChange={(e) => setCreateRideForm({...createRideForm, pickup: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Destination</label>
                  <input
                    type="text"
                    placeholder="Enter destination"
                    value={createRideForm.destination}
                    onChange={(e) => setCreateRideForm({...createRideForm, destination: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                <select
                  value={createRideForm.seats}
                  onChange={(e) => setCreateRideForm({...createRideForm, seats: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {[1,2,3,4,5,6,7].map(num => (
                    <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Post Ride
              </button>
            </form>
          </div>
        )}

        {/* My Rides Tab */}
        {activeTab === 'rides' && (
          <div className="space-y-6">
            {/* Hosting Rides */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Hosting Rides</h2>
              {getUserHostedRides().length === 0 ? (
                <p className="text-gray-500">No rides hosted yet.</p>
              ) : (
                getUserHostedRides().map(ride => (
                  <div key={ride.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{ride.pickup} → {ride.destination}</h4>
                        <p className="text-sm text-gray-600">{ride.date} at {ride.time}</p>
                        <p className="text-sm text-gray-600">{ride.vehicle}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">${ride.price}</div>
                        <div className="text-sm text-gray-500">{ride.availableSeats}/{ride.totalSeats} available</div>
                      </div>
                    </div>
                    
                    {ride.passengers.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-2">Passengers:</h5>
                        <div className="space-y-1">
                          {ride.passengers.map(passenger => (
                            <div key={passenger.id} className="flex justify-between items-center text-sm">
                              <span>{passenger.name}</span>
                              <button
                                onClick={() => removePassenger(ride.id, passenger.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => markRideCompleted(ride.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => deleteRide(ride.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Delete Ride
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Joining Rides */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Joined Rides</h2>
              {getUserJoinedRides().length === 0 ? (
                <p className="text-gray-500">No rides joined yet.</p>
              ) : (
                getUserJoinedRides().map(ride => (
                  <div key={ride.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{ride.pickup} → {ride.destination}</h4>
                        <p className="text-sm text-gray-600">{ride.date} at {ride.time}</p>
                        <p className="text-sm text-gray-600">Host: {ride.hostName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">${ride.price}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => leaveRide(ride.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Leave Ride
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex h-96">
              {/* Chat List */}
              <div className="w-1/3 border-r">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageCircle size={20} />
                    Chats
                  </h2>
                </div>
                <div className="overflow-y-auto">
                  {getUserChats().map(chat => {
                    const otherUser = chat.user1.id === currentUser.id ? chat.user2 : chat.user1;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          activeChat?.id === chat.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{otherUser.name}</h4>
                            <p className="text-sm text-gray-600 truncate">
                              {chat.messages[chat.messages.length - 1]?.text}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex flex-col">
                {activeChat ? (
                  <>
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">
                        {activeChat.user1.id === currentUser.id ? activeChat.user2.name : activeChat.user1.name}
                      </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {activeChat.messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg ${
                              message.senderId === currentUser.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                          onClick={sendMessage}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a chat to start messaging
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Account Tab */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserCircle size={20} />
              My Account
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">{currentUser.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">{currentUser.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">••••••••</div>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setShowAuth(true);
                  setRides([]);
                  setChats([]);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {[
              { id: 'search', icon: Search, label: 'Search' },
              { id: 'create', icon: Plus, label: 'Create' },
              { id: 'rides', icon: Car, label: 'My Rides' },
              { id: 'chat', icon: MessageCircle, label: 'Chat' },
              { id: 'account', icon: UserCircle, label: 'Account' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={20} />
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CarpoolApp;