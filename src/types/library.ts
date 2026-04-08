export type KnowledgeCategory =
  | 'therapeutic_approach'
  | 'disorder'
  | 'technique'
  | 'coping_strategy'
  | 'glossary'
  | 'crisis_resource';

export interface TherapeuticApproach {
  id: string;
  name: string;
  description: string;
  category: 'therapeutic_approach';
  keyPrinciples: string[];
  commonUses: string[];
  founder?: string;
}

export interface Disorder {
  id: string;
  name: string;
  description: string;
  category: 'disorder';
  symptoms: string[];
  prevalence?: string;
  relatedApproaches: string[];
  disclaimer: string;
}

export interface Technique {
  id: string;
  name: string;
  description: string;
  category: 'technique';
  steps: string[];
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedApproach?: string;
}

export interface CopingStrategy {
  id: string;
  name: string;
  description: string;
  category: 'coping_strategy';
  situationsFor: string[];
  steps: string[];
  effectiveness: 'low' | 'medium' | 'high';
}

export interface GlossaryTerm {
  id: string;
  name: string;
  description: string;
  category: 'glossary';
  relatedTerms?: string[];
  example?: string;
}

export interface CrisisResource {
  id: string;
  name: string;
  description: string;
  category: 'crisis_resource';
  phoneNumber?: string;
  textLine?: string;
  website?: string;
  available: string;
  country: string;
}

export type KnowledgeItem =
  | TherapeuticApproach
  | Disorder
  | Technique
  | CopingStrategy
  | GlossaryTerm
  | CrisisResource;
