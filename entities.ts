
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { INode, Edge } from 'reactflow';

@Entity('workflows')
export class WorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  nodes: INode[];

  @Column({ type: 'jsonb', default: [] })
  edges: Edge[];

  @Column({ default: false })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ExecutionEntity, (execution) => execution.workflow)
  executions: ExecutionEntity[];
}

@Entity('executions')
export class ExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['success', 'error', 'running'] })
  status: string;

  @Column({ type: 'jsonb' })
  dataSnapshot: Record<string, any>; // Stores the "Bag of Items" per node

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  stoppedAt: Date;

  @Column({ nullable: true })
  errorDetails: string;

  @ManyToOne(() => WorkflowEntity, (workflow) => workflow.executions)
  workflow: WorkflowEntity;
}
