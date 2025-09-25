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
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
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
    alert(t('support.thankYouMessage', {
      subject: formData.subject,
      email: formData.email,
      category: formData.category
    }));
    setFormData({
      subject: '',
      email: '',
      category: '',
      message: ''
    });
  };

  const faqItems = [
    {
      question: t('support.faq.installation.question'),
      answer: t('support.faq.installation.answer')
    },
    {
      question: t('support.faq.addServer.question'),
      answer: t('support.faq.addServer.answer')
    },
    {
      question: t('support.faq.backup.question'),
      answer: t('support.faq.backup.answer')
    },
    {
      question: t('support.faq.reportBug.question'),
      answer: t('support.faq.reportBug.answer')
    },
    {
      question: t('support.faq.modsSupport.question'),
      answer: t('support.faq.modsSupport.answer')
    }
  ];

  return (
    <SupportContainer>
      <Header>
        <Title>{t('page.support')}</Title>
      </Header>

      <SupportGrid>
        <SupportCard>
          <SupportCardHeader>
            <SupportCardIcon>
              <FiGithub />
            </SupportCardIcon>
            <SupportCardTitle>{t('support.github.title')}</SupportCardTitle>
          </SupportCardHeader>
          <SupportCardContent>
            <p>{t('support.github.description')}</p>
            <p><strong>{t('support.tip')}:</strong> {t('support.github.tip')}</p>
          </SupportCardContent>
          <SupportLink href="https://github.com/gekomod/mcpanel" target="_blank" rel="noopener noreferrer">
            <FiExternalLink /> {t('support.github.action')}
          </SupportLink>
        </SupportCard>

        <SupportCard>
          <SupportCardHeader>
            <SupportCardIcon>
              <FiExternalLink />
            </SupportCardIcon>
            <SupportCardTitle>{t('support.docker.title')}</SupportCardTitle>
          </SupportCardHeader>
          <SupportCardContent>
            <p>{t('support.docker.description')}</p>
            <p><strong>{t('support.tip')}:</strong> {t('support.docker.tip')}</p>
          </SupportCardContent>
          <SupportLink href="https://hub.docker.com/r/gekomod/mcpanel" target="_blank" rel="noopener noreferrer">
            <FiExternalLink /> {t('support.docker.action')}
          </SupportLink>
        </SupportCard>

        <SupportCard>
          <SupportCardHeader>
            <SupportCardIcon>
              <FiMessageSquare />
            </SupportCardIcon>
            <SupportCardTitle>{t('support.community.title')}</SupportCardTitle>
          </SupportCardHeader>
          <SupportCardContent>
            <p>{t('support.community.description')}</p>
            <p><strong>{t('support.tip')}:</strong> {t('support.community.tip')}</p>
          </SupportCardContent>
          <SupportLink href="#" onClick={(e) => { e.preventDefault(); alert(t('support.community.soon')); }}>
            <FiExternalLink /> {t('support.community.action')}
          </SupportLink>
        </SupportCard>
      </SupportGrid>

      <FaqSection>
        <SectionTitle>{t('support.faq.title')}</SectionTitle>
        
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

      <SectionTitle>{t('support.contact.title')}</SectionTitle>
      
      <ContactForm onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="subject">{t('support.contact.subject')}</Label>
          <Input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder={t('support.contact.subjectPlaceholder')}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="email">{t('user.settings.profile.email')}</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('support.contact.emailPlaceholder')}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="category">{t('support.contact.category')}</Label>
          <Select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">{t('support.contact.categoryPlaceholder')}</option>
            <option value="problem">{t('support.contact.categories.problem')}</option>
            <option value="question">{t('support.contact.categories.question')}</option>
            <option value="suggestion">{t('support.contact.categories.suggestion')}</option>
            <option value="other">{t('support.contact.categories.other')}</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="message">{t('support.contact.message')}</Label>
          <TextArea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder={t('support.contact.messagePlaceholder')}
            required
          />
        </FormGroup>
        
        <FormActions>
          <SubmitButton type="submit" disabled={!formData.subject || !formData.email || !formData.category || !formData.message}>
            <FiSend /> {t('support.contact.sendButton')}
          </SubmitButton>
        </FormActions>
      </ContactForm>

    </SupportContainer>
  );
}

export default Support;
