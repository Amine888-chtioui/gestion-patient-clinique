{{-- resources/views/pdf/prescription.blade.php --}}
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordonnance Médicale</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #2c5282;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .clinic-info {
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 10px;
        }
        
        .prescription-title {
            font-size: 28px;
            font-weight: bold;
            color: #2c5282;
            margin: 20px 0;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .patient-info, .doctor-info {
            width: 48%;
        }
        
        .info-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background-color: #f8f9fa;
        }
        
        .info-title {
            font-weight: bold;
            font-size: 16px;
            color: #2c5282;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .info-item {
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
        }
        
        .medications-section {
            margin: 30px 0;
        }
        
        .medications-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 20px;
            text-align: center;
            border-bottom: 2px solid #2c5282;
            padding-bottom: 10px;
        }
        
        .medication {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #fff;
            page-break-inside: avoid;
        }
        
        .medication-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 10px;
        }
        
        .medication-details {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .medication-detail {
            flex: 1;
            min-width: 120px;
        }
        
        .detail-label {
            font-weight: bold;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        
        .detail-value {
            font-size: 14px;
            margin-top: 2px;
        }
        
        .medication-instructions {
            margin-top: 10px;
            padding: 10px;
            background-color: #e3f2fd;
            border-radius: 5px;
            border-left: 4px solid #2196f3;
        }
        
        .instructions-label {
            font-weight: bold;
            font-size: 12px;
            color: #1976d2;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .prescription-notes {
            margin: 30px 0;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 5px;
        }
        
        .notes-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 10px;
        }
        
        .footer {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }
        
        .signature-box {
            width: 45%;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            margin: 20px 0 10px 0;
            height: 50px;
        }
        
        .signature-label {
            font-size: 12px;
            color: #666;
        }
        
        .generation-info {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 20px;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        
        .important-notice {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 10px;
            margin: 20px 0;
            font-size: 12px;
            color: #721c24;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 10px;
            }
            
            .info-section {
                display: block;
            }
            
            .patient-info, .doctor-info {
                width: 100%;
                margin-bottom: 15px;
            }
        }
    </style>
</head>
<body>
    <!-- En-tête de la clinique -->
    <div class="header">
        <div class="clinic-name">{{ $clinicInfo['name'] }}</div>
        <div class="clinic-info">{{ $clinicInfo['address'] }}</div>
        <div class="clinic-info">Tél: {{ $clinicInfo['phone'] }} | Email: {{ $clinicInfo['email'] }}</div>
        <div class="clinic-info">SIRET: {{ $clinicInfo['siret'] }}</div>
    </div>

    <!-- Titre de l'ordonnance -->
    <h1 class="prescription-title">Ordonnance Médicale</h1>

    <!-- Informations patient et médecin -->
    <div class="info-section">
        <div class="patient-info">
            <div class="info-box">
                <div class="info-title">Informations Patient</div>
                <div class="info-item">
                    <span class="info-label">Nom:</span> {{ $patient->name }}
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span> {{ $patient->email }}
                </div>
                @if($patientProfile && $patientProfile->phone)
                <div class="info-item">
                    <span class="info-label">Téléphone:</span> {{ $patientProfile->phone }}
                </div>
                @endif
                @if($patientProfile && $patientProfile->date_of_birth)
                <div class="info-item">
                    <span class="info-label">Né(e) le:</span> {{ \Carbon\Carbon::parse($patientProfile->date_of_birth)->format('d/m/Y') }}
                </div>
                @endif
                @if($patientProfile && $patientProfile->address)
                <div class="info-item">
                    <span class="info-label">Adresse:</span> {{ $patientProfile->address }}
                </div>
                @endif
            </div>
        </div>
        
        <div class="doctor-info">
            <div class="info-box">
                <div class="info-title">Médecin Prescripteur</div>
                <div class="info-item">
                    <span class="info-label">Dr:</span> {{ $doctor->name }}
                </div>
                <div class="info-item">
                    <span class="info-label">Date:</span> {{ \Carbon\Carbon::parse($prescription->date)->format('d/m/Y') }}
                </div>
                <div class="info-item">
                    <span class="info-label">N° Ordre:</span> {{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}
                </div>
            </div>
        </div>
    </div>

    <!-- Section des médicaments -->
    <div class="medications-section">
        <h2 class="medications-title">Prescription</h2>
        
        @foreach($medications as $index => $medication)
        <div class="medication">
            <div class="medication-name">
                {{ $index + 1 }}. {{ $medication->name }}
            </div>
            
            <div class="medication-details">
                <div class="medication-detail">
                    <div class="detail-label">Dosage</div>
                    <div class="detail-value">{{ $medication->dosage }}</div>
                </div>
                
                <div class="medication-detail">
                    <div class="detail-label">Fréquence</div>
                    <div class="detail-value">{{ $medication->frequency }}</div>
                </div>
                
                <div class="medication-detail">
                    <div class="detail-label">Durée</div>
                    <div class="detail-value">{{ $medication->duration }}</div>
                </div>
            </div>
            
            @if($medication->instructions)
            <div class="medication-instructions">
                <div class="instructions-label">Instructions particulières</div>
                <div>{{ $medication->instructions }}</div>
            </div>
            @endif
        </div>
        @endforeach
    </div>

    <!-- Notes du médecin -->
    @if($prescription->notes)
    <div class="prescription-notes">
        <div class="notes-title">Notes du médecin:</div>
        <div>{{ $prescription->notes }}</div>
    </div>
    @endif

    <!-- Avertissements importants -->
    <div class="important-notice">
        <strong>Important:</strong> Cette ordonnance doit être présentée en pharmacie dans les 3 mois suivant sa date d'émission. 
        En cas d'effets indésirables, contactez immédiatement votre médecin ou le service d'urgence le plus proche.
    </div>

    <!-- Pied de page avec signatures -->
    <div class="footer">
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Signature du médecin</div>
                <div style="margin-top: 5px; font-weight: bold;">Dr {{ $doctor->name }}</div>
            </div>
            
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Signature du patient</div>
                <div style="margin-top: 5px;">{{ $patient->name }}</div>
            </div>
        </div>

        <div class="generation-info">
            Document généré le {{ $dateGeneration }} | Ordonnance N° {{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}
            <br>
            Ce document a été généré électroniquement et est valide sans signature manuscrite.
        </div>
    </div>
</body>
</html>