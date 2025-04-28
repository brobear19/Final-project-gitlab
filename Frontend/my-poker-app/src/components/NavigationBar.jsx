import React, { useEffect, useState } from "react";
import { Navbar, Nav, Form, Button, FormControl, Modal, Container, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from '../api/axios';

export default function NavigationBar() {
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);  // 👈 NEW
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false); // 👈 NEW
const [userTransactions, setUserTransactions] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    handleViewBalance();
  }, []);

  const handleViewBalance = async () => {
    try {
      const res = await API.get(`/user/${user.id}`);
      setBalance(res.data.balance);
    } catch (err) {
      alert("Failed to get balance.");
    }
  };

  const handleSearch = async (query) => {
    try {
      if (!query) {
        setSearchResults([]);
        return;
      }
      const res = await API.get(`/user/search?username=${query}`);
      setSearchResults(res.data.users || []);  // assuming your backend sends { users: [...] }
    } catch (err) {
      setSearchResults([]);
    }
  };

  const handleSelectUser = async (userId) => {
    try {
      const userRes = await API.get(`/user/${userId.id}`);
      const transactionRes = await API.get(`/transaction/${userId.id}`);
  
      setSelectedUser(userRes.data);
      setUserTransactions(transactionRes.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to fetch user details.');
    }
  };

  const handleDeposit = async () => {
    try {
      await API.post(`/user/${user.id}/balance`, {
        amount: Number(depositAmount)
      });
      await API.post('/transaction', {
        userId: user.id,
        type: 'deposit',
        amount: Math.abs(depositAmount)
      });
      setShowDepositModal(false);
      setDepositAmount("");
      handleViewBalance();
    } catch (err) {
      alert("Failed to deposit chips.");
    }
  };

  const handleWithdraw = async () => {
    try {
      if (withdrawAmount <= 0) {
        alert("Enter a valid withdraw amount.");
        return;
      }

      if (withdrawAmount > balance) {
        alert("You don't have enough balance to withdraw that amount.");
        return;
      }

      await API.post(`/user/${user.id}/withdraw`, {
        amount: Number(withdrawAmount)
      });

      await API.post('/transaction/', {
        userId: user.id,
        type: 'withdrawal',
        amount: Math.abs(withdrawAmount)
      });

      setShowWithdrawModal(false);
      setWithdrawAmount("");
      handleViewBalance();
    } catch (err) {
      console.error('Withdraw error details:', err.response || err);
      alert(err.response?.data?.message || "Failed to withdraw chips. Please try again later.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  function parseDateWithColonOffset(dateStr) {
    // Regular expression to match the timezone offset at the end of the string
    const timezoneRegex = /([+-]\d{2})(\d{2})$/;
    // Replace the offset by inserting a colon between hours and minutes
    const normalizedDateStr = dateStr.replace(timezoneRegex, '$1:$2');
    return new Date(normalizedDateStr);
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/">Stack Tracker</Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="bg-dark p-2">
            <Nav className="mx-auto position-relative">
              <Form className="d-flex" onSubmit={(e) => { e.preventDefault(); }}>
                <FormControl
                  type="search"
                  placeholder="Search user"
                  className="text-center"
                  value={searchUsername}
                  onChange={(e) => {
                    setSearchUsername(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  style={{ width: '300px' }}
                />
              </Form>

              {/* Autocomplete dropdown */}
              {searchResults.length > 0 && (
                <ListGroup style={{ position: 'absolute', top: '100%', zIndex: 10, width: '300px' }}>
                  {searchResults.map((user) => (
                    <ListGroup.Item
                      key={user.id}
                      action
                      onClick={() => handleSelectUser(user)}
                      className="bg-dark text-white"
                    >
                      {user.username}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Nav>

            <Nav className="ms-auto d-flex align-items-center">
              <FormControl
                readOnly
                value={`🪙 ${balance}`}
                className="me-2 text-center bg-dark text-white"
                style={{ width: '120px', border: 'none' }}
              />

              <Button variant="success" className="me-2" onClick={() => setShowDepositModal(true)}>
                Deposit
              </Button>

              <Button variant="danger" className="me-2" onClick={() => setShowWithdrawModal(true)}>
                Withdraw
              </Button>

              <Button variant="outline-light" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Deposit Modal */}
      <Modal show={showDepositModal} onHide={() => setShowDepositModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Deposit Chips</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="depositAmount">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount to deposit"
              />
            </Form.Group>
            <Button variant="success" className="mt-3" onClick={handleDeposit}>
              Confirm Deposit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Withdraw Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Withdraw Chips</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="withdrawAmount">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
              />
            </Form.Group>
            <Button variant="danger" className="mt-3" onClick={handleWithdraw}>
              Confirm Withdraw
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Selected User Modal */}
      <Modal 
  show={showUserModal} 
  onHide={() => setShowUserModal(false)} 
  dialogClassName="bg-dark text-white"
  contentClassName="bg-dark text-white"
>
  <Modal.Header closeButton className="bg-dark border-0">
    <Modal.Title>User Details</Modal.Title>
  </Modal.Header>
  <Modal.Body className="bg-dark text-white">
    <h5>{selectedUser?.username}</h5>
    <p>Balance: 🪙 {selectedUser?.balance}</p>
    
    <h6 className="mt-4">Transactions:</h6>
    {userTransactions.length > 0 ? (
      <ul className="list-group list-group-flush">
        {userTransactions.map(tx => (
          <li key={tx.id} className="list-group-item bg-dark text-white">
            {tx.type.toUpperCase()}: {tx.amount} chips 
            <br />
            <small>{new Date(tx.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    ) : (
      <p>No transactions found.</p>
    )}
  </Modal.Body>
</Modal>

    </>
  );
}
