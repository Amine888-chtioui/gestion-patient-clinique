// src/components/patient-dashboard/common/ActionMessages.jsx
import React from "react";

const ActionMessages = ({ success, error }) => (
  <>
    {success && (
      <div className="alert alert-success">
        <i className="fas fa-check-circle"></i> {success}
      </div>
    )}
    {error && (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle"></i> {error}
      </div>
    )}
  </>
);

export default ActionMessages;