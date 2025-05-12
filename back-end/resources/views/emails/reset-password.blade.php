<!DOCTYPE html>
<html>
<head>
    <title>Réinitialisation de votre mot de passe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f7f7f7;
            border-radius: 5px;
            padding: 20px;
            margin-top: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            max-width: 150px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            text-align: center;
            color: #777;
        }
        .verification-code {
            background-color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 5px;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
            border: 1px solid #ddd;
            margin: 20px 0;
        }
        .button {
            background-color: #3f51b5;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://example.com/logo.png" alt="Logo">
            <h2>Réinitialisation de votre mot de passe</h2>
        </div>
        
        <p>Bonjour,</p>
        
        <p>Vous recevez cet e-mail car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
        
        <p>Veuillez utiliser le code de vérification ci-dessous pour réinitialiser votre mot de passe :</p>
        
        <div class="verification-code">{{ $token }}</div>
        
        <p>Ce code est valable pendant 60 minutes. Si vous n'avez pas demandé de réinitialisation de mot de passe, aucune action n'est requise.</p>
        
        <p>Cordialement,<br>L'équipe de support</p>
        
        <div class="footer">
            <p>Cet e-mail a été envoyé automatiquement, veuillez ne pas y répondre.</p>
            <p>© 2025 Votre Application. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>