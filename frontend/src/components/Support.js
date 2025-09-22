import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FiGithub, 
  FiMessageSquare, 
  FiMail, 
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiSend
} from 'react-icons/fi';

const SupportContainer = styled.div`
  padding: 20px;
  margin-bottom: 30px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
    border-radius: 3px;
  }
`;

const SupportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
`;

const SupportCard = styled.div`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #3a3f57;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
    border-color: #3b82f6;
  }
`;

const SupportCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const SupportCardIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
`;

const SupportCardTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  margin: 0;
`;

const SupportCardContent = styled.div`
  margin-bottom: 20px;
  
  p {
    margin-bottom: 15px;
    font-size: 15px;
    line-height: 1.7;
    color: #a4aabc;
  }
`;

const SupportLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }
`;

const SectionTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3f57;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
    border-radius: 3px;
  }
`;

const FaqSection = styled.div`
  margin-bottom: 50px;
`;

const FaqItem = styled.div`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 10px;
  margin-bottom: 15px;
  border: 1px solid #3a3f57;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #3b82f6;
  }
`;

const FaqQuestion = styled.div`
  padding: 18px 20px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }
`;

const FaqAnswer = styled.div`
  padding: 0 20px;
  max-height: ${props => props.$isOpen ? '300px' : '0'};
  overflow: hidden;
  transition: max-height 0.4s ease, padding 0.4s ease;
  background-color: #25293a;
  
  ${props => props.$isOpen && `
    padding: 20px;
  `}
  
  p {
    margin-bottom: 15px;
    color: #a4aabc;
    line-height: 1.6;
  }
  
  code {
    background: #35394e;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    color: #fff;
    display: inline-block;
    margin: 5px 0;
  }
`;

const ContactForm = styled.form`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #3a3f57;
  margin-bottom: 40px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #fff;
`;

const Input = styled.input`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 14px 18px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 14px 18px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s ease;
  min-height: 150px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 14px 18px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s ease;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SubmitButton = styled.button`
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 30px 0;
  margin-top: 40px;
  border-top: 1px solid #3a3f57;
  color: #a4aabc;
  font-size: 14px;
  
  a {
    color: #3b82f6;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #8b5cf6;
      text-decoration: underline;
    }
  }
`;

function Support() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    email: '',
    category: '',
    message: ''
  });

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Dziękujemy za wiadomość!\nTemat: ${formData.subject}\nEmail: ${formData.email}\nKategoria: ${formData.category}\n\nTwoja wiadomość została wysłana. Odpowiemy w ciągu 24 godzin.`);
    setFormData({
      subject: '',
      email: '',
      category: '',
      message: ''
    });
  };

  const faqItems = [
    {
      question: "Jak zainstalować panel na własnym serwerze?",
      answer: "Instalacja panelu jest możliwa na dwa sposoby: korzystając z obrazu Dockera lub instalując bezpośrednio na systemie. Zalecamy użycie Dockera - pobierz obraz z Docker Hub i uruchom kontener z odpowiednimi parametrami. Więcej szczegółów znajdziesz w README na GitHub."
    },
    {
      question: "Jak dodać nowy serwer Minecraft?",
      answer: "Aby dodać nowy serwer, przejdź do zakładki 'Serwery' i kliknij kartę 'Dodaj nowy serwer'. Następnie wypełnij formularz, wybierając wersję Minecraft, lokalizację i typ serwera. Po zatwierdzeniu serwer zostanie utworzony w ciągu kilku minut."
    },
    {
      question: "Jak skonfigurować backup serwera?",
      answer: "Backupy można skonfigurować w ustawieniach każdego serwera. Przejdź do zarządzania serwerem, wybierz zakładkę 'Backup' i skonfiguruj harmonogram oraz ustawienia przechowywania kopii zapasowych. System obsługuje backup zarówno na lokalnym dysku, jak i w chmurze."
    },
    {
      question: "Jak zgłosić błąd lub problem?",
      answer: "Problemy i błędy można zgłaszać na kilka sposobów: poprzez formularz kontaktowy na tej stronie, tworząc issue na GitHub lub kontaktując się z nami przez Discord. Przy zgłaszaniu problemu podaj jak najwięcej szczegółów: wersję panelu, system operacyjny i kroki prowadzące do błędu."
    },
    {
      question: "Czy panel wspiera modyfikacje i pluginy?",
      answer: "Tak, panel w pełni obsługuje najpopularniejsze modyfikacje i pluginy do Minecrafta. Możesz łatwo instalować i zarządzać modyfikacjami bezpośrednio z poziomu interfejsu."
    }
  ];

  return (
    <SupportContainer>
      <Header>
        <Title>Wsparcie Techniczne</Title>
      </Header>

      <SupportGrid>
        <SupportCard>
          <SupportCardHeader>
            <SupportCardIcon>
              <FiGithub />
            </SupportCardIcon>
            <SupportCardTitle>GitHub</SupportCardTitle>
          </SupportCardHeader>
          <SupportCardContent>
            <p>Odwiedź nasze repozytorium GitHub, aby zgłaszać problemy, proponować nowe funkcje lub współtworzyć projekt. Kod źródłowy jest dostępny publicznie.</p>
            <p><strong>Wskazówka:</strong> Przed zgłoszeniem problemu sprawdź czy nie został on już rozwiązany w istniejących issue.</p>
          </SupportCardContent>
          <SupportLink href="https://github.com/gekomod/mcpanel" target="_blank" rel="noopener noreferrer">
            <FiExternalLink /> Przejdź do GitHub
          </SupportLink>
        </SupportCard>

        <SupportCard>
          <SupportCardHeader>
            <SupportCardIcon>
              <FiExternalLink />
            </SupportCardIcon>
            <SupportCardTitle>Docker Hub</SupportCardTitle>
          </SupportCardHeader>
          <SupportCardContent>
            <p>Pobierz najnowszy obraz Dockera naszego panelu. Zawiera on wszystkie niezbędne zależności i jest gotowy do uruchomienia w środowisku produkcyjnym.</p>
            <p><strong>Wskazówka:</strong> Użyj tagu "latest" dla najnowszej stabilnej wersji lub wybierz konkretną wersję dla zgodności.</p>
          </SupportCardContent>
          <SupportLink href="https://hub.docker.com/r/gekomod/mcpanel" target="_blank" rel="noopener noreferrer">
            <FiExternalLink /> Przejdź do Docker Hub
          </SupportLink>
        </SupportCard>

        <SupportCard>
          <SupportCardHeader>
            <SupportCardIcon>
              <FiMessageSquare />
            </SupportCardIcon>
            <SupportCardTitle>Społeczność</SupportCardTitle>
          </SupportCardHeader>
          <SupportCardContent>
            <p>Dołącz do naszej społeczności na Discordzie, gdzie możesz uzyskać pomoc od innych użytkowników, dzielić się swoimi doświadczeniami i śledzić najnowsze aktualizacje.</p>
            <p><strong>Wskazówka:</strong> Społeczność to doskonałe miejsce do uzyskania szybkiej pomocy i inspiracji.</p>
          </SupportCardContent>
          <SupportLink href="#" onClick={(e) => { e.preventDefault(); alert('Link do Discord zostanie wkrótce udostępniony!'); }}>
            <FiExternalLink /> Dołącz do Discord
          </SupportLink>
        </SupportCard>
      </SupportGrid>

      <FaqSection>
        <SectionTitle>Najczęściej Zadawane Pytania</SectionTitle>
        
        {faqItems.map((faq, index) => (
          <FaqItem key={index}>
            <FaqQuestion onClick={() => toggleFaq(index)}>
              {faq.question}
              {openFaqIndex === index ? <FiChevronUp /> : <FiChevronDown />}
            </FaqQuestion>
            <FaqAnswer $isOpen={openFaqIndex === index}>
              <p>{faq.answer}</p>
            </FaqAnswer>
          </FaqItem>
        ))}
      </FaqSection>

      <SectionTitle>Skontaktuj się z nami</SectionTitle>
      
      <ContactForm onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="subject">Temat</Label>
          <Input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="Temat zapytania"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Twój adres email"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="category">Kategoria</Label>
          <Select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Wybierz kategorię</option>
            <option value="problem">Problem techniczny</option>
            <option value="question">Pytanie</option>
            <option value="suggestion">Sugestia</option>
            <option value="other">Inne</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="message">Wiadomość</Label>
          <TextArea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Opisz swój problem lub pytanie..."
            required
          />
        </FormGroup>
        
        <FormActions>
          <SubmitButton type="submit" disabled={!formData.subject || !formData.email || !formData.category || !formData.message}>
            <FiSend /> Wyślij wiadomość
          </SubmitButton>
        </FormActions>
      </ContactForm>

    </SupportContainer>
  );
}

export default Support;
